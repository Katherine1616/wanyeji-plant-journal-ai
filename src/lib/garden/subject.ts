import "server-only";

import sharp from "sharp";

/**
 * Turns a generated image that sits on a flat solid backdrop into a trimmed,
 * transparent PNG subject — the same visual form as the eight preset
 * illustrations in `public/plants/cell-*.png`.
 *
 * The image model can only paint a backdrop, never real alpha. So we ask it for
 * a flat warm-white backdrop (the colour of both journal surfaces) and cut it
 * out deterministically here:
 *
 *   1. find the flat backdrop colour from the canvas border,
 *   2. flood-fill the region connected to the border, so pale tones *inside* the
 *      subject (a white pot, cream petals) survive,
 *   3. fade the outline over the last couple of pixels via a distance transform,
 *      which removes the anti-aliased blend ring the model paints at the edge,
 *   4. desaturate those semi-transparent edge pixels so no colour cast survives,
 *   5. trim to the alpha bounds and add even transparent padding.
 */

type Rgb = readonly [number, number, number];

/** The backdrop we ask the model for. Both journal surfaces are warm whites
 * (`--background: #f4f1e9`, `--card: #fbf8f1`), so anything the model leaves at
 * the outline is invisible on the page — unlike a saturated chroma key, whose
 * residue showed up as a coloured fringe around the leaves.
 */
export const BACKDROP_KEY: Rgb = [255, 255, 255];

const MAX_EDGE = 1200;
/**
 * Distance under which a pixel counts as backdrop while flood filling. Kept
 * tight for a light backdrop: pale watercolour washes sit close to white, and
 * eating them would wash the illustration out instead of just its background.
 */
const KEY_THRESHOLD_LIGHT = 42;
const KEY_THRESHOLD_SATURATED = 105;
/** Feather depth, in pixels, inside the backdrop boundary. */
const EDGE_RAMP = 2.5;
/** Backdrop must cover at least this share of the canvas, else nothing was keyed. */
const MIN_KEYED_FRACTION = 0.02;
const PADDING_RATIO = 0.06;

export type IsolationResult = {
  png: Buffer;
  width: number;
  height: number;
  backgroundKey: Rgb | null;
  keyed: boolean;
};

function distance(key: Rgb, r: number, g: number, b: number): number {
  const dr = key[0] - r;
  const dg = key[1] - g;
  const db = key[2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Samples the canvas border; a solid backdrop owns most of it. */
function detectBackdropKey(data: Buffer, width: number, height: number): Rgb | null {
  const stepX = Math.max(1, Math.floor(width / 64));
  const stepY = Math.max(1, Math.floor(height / 64));
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  let samples = 0;

  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const bucket = `${Math.floor(r / 24)}-${Math.floor(g / 24)}-${Math.floor(b / 24)}`;
    const entry = buckets.get(bucket) ?? { count: 0, r: 0, g: 0, b: 0 };
    entry.count += 1;
    entry.r += r;
    entry.g += g;
    entry.b += b;
    buckets.set(bucket, entry);
    samples += 1;
  };

  for (let x = 0; x < width; x += stepX) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 0; y < height; y += stepY) {
    sample(0, y);
    sample(width - 1, y);
  }
  if (samples === 0) return null;

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const entry of buckets.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  if (!best || best.count < samples * 0.55) return null;
  return [
    Math.round(best.r / best.count),
    Math.round(best.g / best.count),
    Math.round(best.b / best.count),
  ];
}

/** Backdrop reachable from the canvas border. */
function floodBackdrop(
  rgba: Buffer,
  width: number,
  height: number,
  key: Rgb,
): { keyed: Uint8Array; keyedCount: number } {
  const total = width * height;
  const threshold = luma(key[0], key[1], key[2]) > 200 ? KEY_THRESHOLD_LIGHT : KEY_THRESHOLD_SATURATED;
  const near = new Uint8Array(total);
  for (let p = 0; p < total; p += 1) {
    const i = p * 4;
    near[p] = distance(key, rgba[i], rgba[i + 1], rgba[i + 2]) <= threshold ? 1 : 0;
  }

  const keyed = new Uint8Array(total);
  const stack: number[] = [];
  const push = (p: number) => {
    if (!near[p] || keyed[p]) return;
    keyed[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (stack.length > 0) {
    const p = stack.pop() as number;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y > 0) push(p - width);
    if (y < height - 1) push(p + width);
  }

  let keyedCount = 0;
  for (let p = 0; p < total; p += 1) {
    if (keyed[p]) keyedCount += 1;
  }
  return { keyed, keyedCount };
}

/**
 * Two-pass chamfer distance transform: how far each pixel sits from the
 * backdrop. Used to fade the outline instead of leaving the model's
 * anti-aliased blend ring as a halo.
 */
function distanceFromBackdrop(keyed: Uint8Array, width: number, height: number): Float32Array {
  const total = width * height;
  const far = width + height;
  const d = new Float32Array(total);
  for (let p = 0; p < total; p += 1) d[p] = keyed[p] ? 0 : far;

  const diagonal = Math.SQRT2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      if (d[p] === 0) continue;
      let best = d[p];
      if (x > 0) best = Math.min(best, d[p - 1] + 1);
      if (y > 0) best = Math.min(best, d[p - width] + 1);
      if (x > 0 && y > 0) best = Math.min(best, d[p - width - 1] + diagonal);
      if (x < width - 1 && y > 0) best = Math.min(best, d[p - width + 1] + diagonal);
      d[p] = best;
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const p = y * width + x;
      if (d[p] === 0) continue;
      let best = d[p];
      if (x < width - 1) best = Math.min(best, d[p + 1] + 1);
      if (y < height - 1) best = Math.min(best, d[p + width] + 1);
      if (x < width - 1 && y < height - 1) best = Math.min(best, d[p + width + 1] + diagonal);
      if (x > 0 && y < height - 1) best = Math.min(best, d[p + width - 1] + diagonal);
      d[p] = best;
    }
  }
  return d;
}

export async function isolateSubject(
  input: Buffer,
  requestedKey: Rgb = BACKDROP_KEY,
): Promise<IsolationResult> {
  const { data, info } = await sharp(input)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const total = width * height;
  const rgba = Buffer.from(data);

  // Trust the colour the model actually painted when it ignored the request.
  const detected = detectBackdropKey(rgba, width, height);
  const key: Rgb =
    detected &&
    distance(detected, requestedKey[0], requestedKey[1], requestedKey[2]) > KEY_THRESHOLD_SATURATED
      ? detected
      : requestedKey;

  const { keyed, keyedCount } = floodBackdrop(rgba, width, height, key);
  const coverage = keyedCount / total;
  if (coverage < MIN_KEYED_FRACTION) {
    const png = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
    return { png, width, height, backgroundKey: null, keyed: false };
  }

  // For a saturated key, pockets of backdrop fully enclosed by the subject (the
  // gap between two leaves) are backdrop too. Never for a light key: that would
  // eat the illustration's own cream and white tones.
  if (luma(key[0], key[1], key[2]) < 200) {
    const seen = new Uint8Array(total);
    const queue: number[] = [];
    for (let p = 0; p < total; p += 1) {
      if (keyed[p] || seen[p]) continue;
      const i = p * 4;
      if (
        Math.abs(rgba[i] - key[0]) >= 48 ||
        Math.abs(rgba[i + 1] - key[1]) >= 48 ||
        Math.abs(rgba[i + 2] - key[2]) >= 48
      ) {
        continue;
      }
      // Walk the whole candidate pocket before deciding, so a subject region
      // that merely starts near the key colour is never erased.
      const pocket: number[] = [];
      let uniform = true;
      const walk = (start: number) => {
        queue.push(start);
        seen[start] = 1;
      };
      walk(p);
      while (queue.length > 0) {
        const q = queue.pop() as number;
        pocket.push(q);
        const qi = q * 4;
        if (distance(key, rgba[qi], rgba[qi + 1], rgba[qi + 2]) > 90) uniform = false;
        const qx = q % width;
        const qy = (q - qx) / width;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = qx + dx;
          const ny = qy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (seen[np] || keyed[np]) continue;
          const ni = np * 4;
          if (distance(key, rgba[ni], rgba[ni + 1], rgba[ni + 2]) > 90) continue;
          walk(np);
        }
      }
      const small = pocket.length <= total * 0.04;
      if (uniform && small) {
        for (const q of pocket) keyed[q] = 1;
      }
    }
  }

  const depth = distanceFromBackdrop(keyed, width, height);
  const output = Buffer.from(rgba);
  for (let p = 0; p < total; p += 1) {
    const i = p * 4;
    if (keyed[p]) {
      output[i + 3] = 0;
      continue;
    }
    const fade = depth[p] >= EDGE_RAMP ? 1 : depth[p] / EDGE_RAMP;
    const sourceAlpha = rgba[i + 3] / 255;
    output[i + 3] = Math.round(sourceAlpha * fade * 255);

    // Semi-transparent edge pixels still carry the backdrop's tint; pulling them
    // toward their own luminance hides that without touching solid interior paint.
    if (fade < 1) {
      const grey = luma(rgba[i], rgba[i + 1], rgba[i + 2]);
      const blend = (1 - fade) * 0.65;
      output[i] = Math.round(rgba[i] + (grey - rgba[i]) * blend);
      output[i + 1] = Math.round(rgba[i + 1] + (grey - rgba[i + 1]) * blend);
      output[i + 2] = Math.round(rgba[i + 2] + (grey - rgba[i + 2]) * blend);
    }
  }

  const trimmed = await sharp(output, { raw: { width, height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });

  const trimmedWidth = trimmed.info.width;
  const trimmedHeight = trimmed.info.height;
  const pad = Math.max(8, Math.round(Math.max(trimmedWidth, trimmedHeight) * PADDING_RATIO));
  const png = await sharp(trimmed.data)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    // Palette quantisation keeps the transparency but cuts the file to roughly a
    // third — a mobile grid of eight of these should not weigh several megabytes.
    .png({ palette: true, quality: 90, effort: 8 })
    .toBuffer();

  return {
    png,
    width: trimmedWidth + pad * 2,
    height: trimmedHeight + pad * 2,
    backgroundKey: key,
    keyed: true,
  };
}
