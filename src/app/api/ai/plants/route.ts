import { NextResponse, type NextRequest } from "next/server";
import { cutoutPlant, identifyPlant, illustratePlant } from "@/lib/garden/ai";

/**
 * POST /api/ai/plants { photoUrl, step }
 * step=cutout  → background removed photo
 * step=identify → species, latin name and care defaults
 * step=illustrate → three illustration candidates in the journal's art style
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { photoUrl?: string; step?: string; count?: number }
    | null;
  const photoUrl = body?.photoUrl?.trim();
  const step = body?.step ?? "illustrate";
  if (!photoUrl) {
    return NextResponse.json(
      { ok: false, error: "missing_photo" },
      { status: 400 },
    );
  }

  try {
    if (step === "cutout") {
      const url = await cutoutPlant(photoUrl);
      return NextResponse.json({ ok: true, data: { cutoutUrl: url } });
    }
    if (step === "identify") {
      const data = await identifyPlant(
        photoUrl,
        "local_user",
        request.headers.get("x-app-locale"),
      );
      return NextResponse.json({ ok: true, data });
    }
    const images = await illustratePlant(photoUrl, body?.count ?? 3);
    return NextResponse.json({ ok: true, data: { images } });
  } catch (error) {
    console.error("[ai/plants]", error);
    return NextResponse.json({ ok: false, error: "ai_failed" }, { status: 502 });
  }
}
