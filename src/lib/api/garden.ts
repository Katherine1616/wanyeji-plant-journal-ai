"use client";

import type { LightNeed } from "@/lib/garden/types";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; data?: T; error?: string }
    | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `request_failed_${response.status}`);
  }
  return payload.data as T;
}

export type PlantAiResult =
  | { cutoutUrl: string | null }
  | { images: string[] }
  | {
      species: string;
      latinName: string;
      nickname: string;
      waterIntervalDays: number;
      fertilizeIntervalDays: number;
      lightNeed: LightNeed;
      tempRange: string;
    };

export async function runPlantAi(
  photoUrl: string,
  step: "cutout" | "identify" | "illustrate",
  count = 3,
): Promise<PlantAiResult> {
  return readJson<PlantAiResult>(
    await fetch("/api/ai/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl, step, count }),
    }),
  );
}

export async function uploadPlantPhoto(file: File): Promise<{ key: string; url: string }> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("photo_read_failed"));
    reader.readAsDataURL(file);
  });
  return { key: `local/${file.name}`, url };
}
