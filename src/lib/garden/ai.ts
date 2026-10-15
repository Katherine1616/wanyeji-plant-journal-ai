import "server-only";
import { googleAi } from "@/lib/google-ai";
import { isolateSubject } from "./subject";
import type { LightNeed } from "./types";

const STYLE_PROMPT = [
  "A soft muted watercolour botanical illustration of the single plant in the reference photo,",
  "drawn in a delicate thin-line Japanese botanical catalogue style:",
  "pale sage green and cream palette, low saturation, fine 1.5px ink contours,",
  "tiny cross-hatching for shading, the plant centred with generous empty margins,",
  "a simple terracotta or ceramic pot at the base matching the reference photo.",
  "Draw exactly one plant with its one pot — no other plants, pots, furniture or scenery.",
  "The image must contain no text of any kind: no letters, no words, no captions, no labels,",
  "no numbers, no signature, no handwritten notes, in any language.",
  "Fill the entire canvas behind the plant with one flat, uniform pure white background",
  "(#FFFFFF), edge to edge, with no gradient, no vignette, no texture, no drop shadow,",
  "no ground line, no frame, no border, no text, no watermark. The plant and pot must stay",
  "fully inside the canvas and never touch the canvas edge.",
].join(" ");

export type PlantIdentification = {
  species: string;
  latinName: string;
  waterIntervalDays: number;
  fertilizeIntervalDays: number;
  lightNeed: LightNeed;
  tempRange: string;
  nickname: string;
};

function parseJson(raw: string): Record<string, unknown> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeLight(value: unknown): LightNeed {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("shade") || text.includes("阴")) return "shade";
  if (text.includes("full") || text.includes("sun") || text.includes("充足") || text.includes("日照")) {
    return "full";
  }
  return "indirect";
}

function languageName(locale?: string | null): string {
  const value = (locale ?? "").toLowerCase();
  if (value.startsWith("zh")) return "Simplified Chinese";
  if (value.startsWith("ja")) return "Japanese";
  if (value.startsWith("ko")) return "Korean";
  if (value.startsWith("es")) return "Spanish";
  return "English";
}

/** Vision pass: names the plant and suggests its care defaults. */
export async function identifyPlant(
  imageUrl: string,
  viewerUserId?: string,
  locale?: string | null,
): Promise<PlantIdentification> {
  const language = languageName(locale);
  const response = await googleAi.chat({
    messages: [
      {
        role: "system",
        content:
          "You identify houseplants for a family plant journal. Reply with JSON only, " +
          'shape: {"species":"龟背竹","latinName":"Monstera deliciosa","nickname":"小龟背",' +
          '"waterIntervalDays":7,"fertilizeIntervalDays":30,"lightNeed":"indirect|shade|full",' +
          '"tempRange":"18–28°C"}. Write "species", "nickname" and "tempRange" in ' +
          `${language}; keep "latinName" in Latin script and "lightNeed" as one of the three ` +
          "English keywords. The nickname should be a warm, short pet name of at most 6 characters.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Identify this plant and suggest its care defaults, written in ${language}.`,
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });
  void viewerUserId;

  const raw = response.choices?.[0]?.message?.content ?? "";
  const parsed = parseJson(typeof raw === "string" ? raw : JSON.stringify(raw)) ?? {};
  const water = Number(parsed.waterIntervalDays);
  const feed = Number(parsed.fertilizeIntervalDays);
  return {
    species: String(parsed.species ?? "").trim() || "未知植物",
    latinName: String(parsed.latinName ?? "").trim(),
    nickname: String(parsed.nickname ?? "").trim().slice(0, 8) || "小植物",
    waterIntervalDays: Number.isFinite(water) ? Math.min(Math.max(Math.round(water), 1), 30) : 7,
    fertilizeIntervalDays: Number.isFinite(feed)
      ? Math.min(Math.max(Math.round(feed), 7), 60)
      : 30,
    lightNeed: normalizeLight(parsed.lightNeed),
    tempRange: String(parsed.tempRange ?? "").trim() || "15–28°C",
  };
}

/** Accepts a data URL, a hosted URL, or a bare base64 payload. */
async function fetchImage(value: string): Promise<Buffer | null> {
  const dataUrl = value.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (dataUrl) return Buffer.from(dataUrl[2], "base64");
  if (/^https?:\/\//i.test(value)) {
    const response = await fetch(value);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  }
  if (value.length > 512 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
    return Buffer.from(value, "base64");
  }
  return null;
}

async function encodePng(buffer: Buffer): Promise<string> {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Renders one image and turns it into the journal's asset form: a transparent,
 * trimmed PNG data URL — the same shape as `public/plants/cell-*.png`,
 * so it floats on the washi paper instead of sitting in a white rectangle.
 *
 * The model can only paint a backdrop, so the alpha comes from keying that
 * backdrop out afterwards (`isolateSubject`).
 */
async function renderSubject(
  prompt: string,
  folder: string,
  reference?: string,
): Promise<string | null> {
  const result = await googleAi.generateImage({
    prompt,
    size: "1024x1024",
    image: reference ? [reference] : undefined,
  });
  const first = result.data?.[0];
  const raw = first?.url ?? first?.b64_json ?? result.image_url ?? null;
  if (!raw) return null;

  const source = await fetchImage(raw);
  if (!source) return null;

  const isolated = await isolateSubject(source);
  // A backdrop that could not be keyed means the model ignored the flat
  // background entirely; showing it would put a coloured rectangle on the page.
  if (!isolated.keyed) return null;

  void folder;
  return encodePng(isolated.png);
}

/** Removes the background so only the plant subject remains. */
export async function cutoutPlant(photoUrl: string): Promise<string | null> {
  return renderSubject(
    "Cut out the plant and its pot from this photo, keeping the subject pixel-accurate " +
      "and reproducing its real pot, leaves and colours. Fill the entire canvas behind it " +
      "with one flat, uniform pure white background (#FFFFFF), edge to edge, with no " +
      "gradient, no texture, no drop shadow, no frame, no text. The subject must stay fully " +
      "inside the canvas and never touch the canvas edge.",
    "cutout",
    photoUrl,
  );
}

/** Turns a photo into illustrations that match the balcony journal's art series. */
export async function illustratePlant(
  photoUrl: string | null,
  count = 3,
): Promise<string[]> {
  const variants = [
    STYLE_PROMPT,
    `${STYLE_PROMPT} Slightly airier composition, lighter watercolour washes.`,
    `${STYLE_PROMPT} Slightly richer foliage detail, deeper sage shadows.`,
  ].slice(0, Math.min(Math.max(count, 1), 4));

  const results: string[] = [];
  for (const prompt of variants) {
    const url = await renderSubject(prompt, "illustration", photoUrl ?? undefined);
    if (url) results.push(url);
  }
  return results;
}

export function stylePromptForEdit() {
  return STYLE_PROMPT;
}
