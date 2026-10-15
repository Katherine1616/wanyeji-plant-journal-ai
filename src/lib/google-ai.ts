import "server-only";

type ChatMessage = {
  role: string;
  content: unknown;
};

type ChatResult = {
  choices?: Array<{ message?: { content?: string } }>;
};

export type GenerateImageParams = {
  prompt: string;
  size?: string;
  image?: string[];
};

export type GenerateImageResult = {
  image_url?: string;
  data?: Array<{ url?: string; b64_json?: string }>;
};

function apiKey() {
  const value = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!value) throw new Error("GOOGLE_AI_API_KEY is not configured");
  return value;
}

function apiBase() {
  return (process.env.GOOGLE_AI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta")
    .replace(/\/+$/, "")
    .replace(/\/openai$/, "");
}

function visionModel() {
  return process.env.GOOGLE_AI_VISION_MODEL || process.env.GOOGLE_AI_MODEL || "gemini-3.1-flash-image";
}

function imageModel() {
  return process.env.GOOGLE_AI_IMAGE_MODEL || process.env.GOOGLE_AI_MODEL || "gemini-3.1-flash-image";
}

async function errorText(response: Response) {
  const body = await response.text().catch(() => "");
  return body ? `: ${body.slice(0, 300)}` : "";
}

async function inlineImage(url: string) {
  const dataUrl = url.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (dataUrl) {
    return {
      inlineData: {
        mimeType: dataUrl[1],
        data: dataUrl[2].replace(/\s+/g, ""),
      },
    };
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Reference image could not be fetched (${response.status})`);
  const mimeType = (response.headers.get("content-type") || "image/png").split(";")[0].trim();
  const data = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { inlineData: { mimeType, data } };
}

async function chat(params: { messages: ChatMessage[] }): Promise<ChatResult> {
  const response = await fetch(`${apiBase()}/openai/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ model: visionModel(), messages: params.messages }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Google vision request failed (${response.status})${await errorText(response)}`);
  }
  return (await response.json()) as ChatResult;
}

async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const parts: unknown[] = [{ text: params.prompt }];
  for (const reference of params.image ?? []) {
    if (reference) parts.push(await inlineImage(reference));
  }

  const response = await fetch(`${apiBase()}/models/${imageModel()}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Google image request failed (${response.status})${await errorText(response)}`);
  }

  const body = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
    }>;
  };
  const images = (body.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.inlineData?.data)
    .filter((data): data is string => typeof data === "string" && data.length > 0);

  if (images.length === 0) throw new Error("Google image request returned no image");
  return { data: images.map((b64_json) => ({ b64_json })) };
}

export const googleAi = { chat, generateImage };
