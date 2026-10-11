import { MARK_ANTENNAE, MARK_BOX, MARK_SEGMENTS, MARK_STROKE } from "@/lib/brand";
import { PATH_ROWS, PATH_SAMPLES } from "./shaders";

// Every formation describes where each of its ants should be, in stage pixels
// relative to the stage centre (y up). Builders work in canvas space (y down) and
// the writer converts. A formation holds only the ants it uses: each stage on the
// page gets its own, and they stay in that stage.

export const INK = 0;
export const RED = 1;
export const WHITE = 2;

type Pt = [number, number];

export interface PathDef {
  pts: Float32Array;
  closed: boolean;
  length: number;
}

export interface Formation {
  a: Float32Array;
  b: Float32Array;
  paths: PathDef[];
  antSize: number;
  used: number;
}

export interface BuildCtx {
  w: number;
  h: number;
  // The most ants the formation may use.
  n: number;
  mobile: boolean;
}

export type FormationName = "mark" | "devices" | "trail" | "flow" | "parity" | "markwhite";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ------------------------------------------------------------------ masks */

interface Mask {
  data: Uint8ClampedArray;
  cw: number;
  ch: number;
  sx: number;
  sy: number;
  w: number;
  h: number;
}

function rasterMask(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, maxDim = 800): Mask {
  const res = Math.min(1, maxDim / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * res));
  const ch = Math.max(1, Math.round(h * res));
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(cw / w, ch / h);
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  draw(ctx);
  return { data: ctx.getImageData(0, 0, cw, ch).data, cw, ch, sx: cw / w, sy: ch / h, w, h };
}

function maskAt(m: Mask, x: number, y: number) {
  const ix = Math.floor(x * m.sx);
  const iy = Math.floor(y * m.sy);
  if (ix < 0 || iy < 0 || ix >= m.cw || iy >= m.ch) return false;
  return m.data[(iy * m.cw + ix) * 4 + 3] > 127;
}

function maskArea(m: Mask) {
  let c = 0;
  for (let i = 3; i < m.data.length; i += 4) if (m.data[i] > 127) c++;
  return c / (m.sx * m.sy);
}

// Evenly spread points over a mask: a jittered hex grid, trimmed or padded to count.
function scatter(m: Mask, count: number, rng: () => number): Pt[] {
  const area = maskArea(m);
  if (area <= 0 || count <= 0) return [];
  const s = Math.sqrt(area / count) * 0.93;
  const pts: Pt[] = [];
  let row = 0;
  for (let y = s * 0.5; y < m.h; y += s * 0.866, row++) {
    for (let x = (row % 2 ? s : s * 0.5); x < m.w; x += s) {
      const jx = x + (rng() - 0.5) * s * 0.55;
      const jy = y + (rng() - 0.5) * s * 0.55;
      if (maskAt(m, jx, jy)) pts.push([jx, jy]);
    }
  }
  shuffle(pts, rng);
  if (pts.length > count) pts.length = count;
  let guard = 0;
  while (pts.length < count && guard++ < count * 80) {
    const x = rng() * m.w;
    const y = rng() * m.h;
    if (maskAt(m, x, y)) pts.push([x, y]);
  }
  return pts;
}

const antsFor = (area: number, size: number, density = 1) => Math.round((area / (size * size * 0.3)) * density);

/* ------------------------------------------------------------------ paths */

function catmull(ctrl: Pt[], steps = 20, closed = false): Pt[] {
  const out: Pt[] = [];
  const n = ctrl.length;
  const get = (i: number) => (closed ? ctrl[(i + n) % n] : ctrl[clamp(i, 0, n - 1)]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(ctrl[n - 1]);
  return out;
}

function circlePts(cx: number, cy: number, r: number, steps = 160): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function roundRectPts(x: number, y: number, w: number, h: number, r: number, steps = 14): Pt[] {
  const out: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return out;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/* ----------------------------------------------------------------- writer */

class Writer {
  a: Float32Array;
  b: Float32Array;
  i = 0;
  paths: PathDef[] = [];
  private raw: Pt[][] = [];

  constructor(private n: number, private w: number, private h: number) {
    this.a = new Float32Array(n * 4);
    this.b = new Float32Array(n * 4);
  }

  get full() {
    return this.i >= this.n;
  }

  get left() {
    return this.n - this.i;
  }

  private cx(x: number) {
    return x - this.w / 2;
  }

  private cy(y: number) {
    return this.h / 2 - y;
  }

  private put(a0: number, a1: number, a2: number, a3: number, b0: number, b1: number, b2: number, b3: number) {
    if (this.full) return;
    const k = this.i * 4;
    this.a[k] = a0; this.a[k + 1] = a1; this.a[k + 2] = a2; this.a[k + 3] = a3;
    this.b[k] = b0; this.b[k + 1] = b1; this.b[k + 2] = b2; this.b[k + 3] = b3;
    this.i++;
  }

  point(x: number, y: number, tint = RED) {
    this.put(this.cx(x), this.cy(y), 0, 0, 0, 0, 0, tint);
  }

  points(pts: Pt[], tint = RED) {
    for (const [x, y] of pts) this.point(x, y, tint);
  }

  segment(x0: number, y0: number, x1: number, y1: number, u0: number, pxPerSec: number, offset: number, tint = RED) {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    this.put(this.cx(x0), this.cy(y0), this.cx(x1), this.cy(y1), u0, pxPerSec / len, offset, tint + 10);
  }

  addPath(points: Pt[], closed: boolean) {
    const src = closed ? [...points, points[0]] : points;
    const cum = [0];
    for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + Math.hypot(src[i][0] - src[i - 1][0], src[i][1] - src[i - 1][1]));
    const total = cum[cum.length - 1] || 1;
    const pts = new Float32Array(PATH_SAMPLES * 2);
    const resampled: Pt[] = [];
    let seg = 0;
    for (let s = 0; s < PATH_SAMPLES; s++) {
      const t = (s / (PATH_SAMPLES - 1)) * total;
      while (seg < cum.length - 2 && cum[seg + 1] < t) seg++;
      const span = cum[seg + 1] - cum[seg] || 1;
      const f = clamp((t - cum[seg]) / span, 0, 1);
      const x = src[seg][0] + (src[seg + 1][0] - src[seg][0]) * f;
      const y = src[seg][1] + (src[seg + 1][1] - src[seg][1]) * f;
      resampled.push([x, y]);
      pts[s * 2] = this.cx(x);
      pts[s * 2 + 1] = this.cy(y);
    }
    this.paths.push({ pts, closed, length: total });
    this.raw.push(resampled);
    return this.paths.length - 1;
  }

  // Arc-length fraction of the path sample nearest to (x, y).
  nearestU(pathIndex: number, x: number, y: number) {
    const r = this.raw[pathIndex];
    let best = 0, bd = Infinity;
    for (let i = 0; i < r.length; i++) {
      const d = (r[i][0] - x) ** 2 + (r[i][1] - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best / (PATH_SAMPLES - 1);
  }

  path(pathIndex: number, u0: number, pxPerSec: number, offset: number, tint = RED) {
    const p = this.paths[pathIndex];
    this.put(pathIndex, p.closed ? 1 : 0, p.length, 0, ((u0 % 1) + 1) % 1, pxPerSec / p.length, offset, tint + 20);
  }

  // Fill a path lane with evenly spaced marching ants.
  lane(pathIndex: number, spacing: number, pxPerSec: number, offset: number, tint: number, rng: () => number) {
    const p = this.paths[pathIndex];
    const count = Math.max(1, Math.floor(p.length / spacing));
    for (let k = 0; k < count && !this.full; k++) {
      this.path(pathIndex, (k + (rng() - 0.5) * 0.5) / count, pxPerSec * (0.94 + rng() * 0.12), offset + (rng() - 0.5) * 1.6, tint);
    }
  }

  finish(rng: () => number, antSize: number): Formation {
    const used = this.i;
    // Shuffle, so a formation trimmed to fit the colony loses a random share of its ants.
    const order = shuffle(Array.from({ length: used }, (_, k) => k), rng);
    const a = new Float32Array(used * 4);
    const b = new Float32Array(used * 4);
    order.forEach((src, dst) => {
      a.set(this.a.subarray(src * 4, src * 4 + 4), dst * 4);
      b.set(this.b.subarray(src * 4, src * 4 + 4), dst * 4);
    });
    if (this.paths.length > PATH_ROWS) this.paths.length = PATH_ROWS;
    return { a, b, paths: this.paths, antSize, used };
  }
}

/* ------------------------------------------------------------- formations */

function markTransform(w: number, h: number, fit: number) {
  const s = Math.min(w / MARK_BOX.w, h / MARK_BOX.h) * fit;
  return { s, ox: (w - MARK_BOX.w * s) / 2, oy: (h - MARK_BOX.h * s) / 2 };
}

// The geeknative mark: a disc of ants, with the three-segment ant left as negative space.
function mark({ w, h, n, mobile }: BuildCtx): Formation {
  const rng = mulberry32(7);
  const D = Math.min(w, h);
  const antSize = clamp(D / (mobile ? 44 : 52), 7, 12);
  const { s, ox, oy } = markTransform(w, h, 0.985);
  const pad = (antSize * 0.45) / s;
  const m = rasterMask(w, h, (ctx) => {
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    for (const c of MARK_SEGMENTS) {
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r + pad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = MARK_STROKE + pad * 2;
    ctx.lineCap = "round";
    for (const d of MARK_ANTENNAE) ctx.stroke(new Path2D(d));
  });
  const W = new Writer(n, w, h);
  W.points(scatter(m, Math.min(n, antsFor(maskArea(m), antSize, 1.4)), rng), RED);
  return W.finish(rng, antSize);
}

// The mark in white, for the red closing section: a marching ring around a solid ant.
function markwhite({ w, h, n }: BuildCtx): Formation {
  const rng = mulberry32(11);
  const antSize = clamp(Math.min(w, h) / 52, 7, 11);
  const { s, ox, oy } = markTransform(w, h, 1);
  const W = new Writer(n, w, h);
  const ring = W.addPath(circlePts(ox + 12 * s, oy + 12 * s, 12 * s, 220), true);
  W.lane(ring, antSize * 1.35, 34, -3, WHITE, rng);
  W.lane(ring, antSize * 1.35, -30, 3.5, WHITE, rng);
  const m = rasterMask(w, h, (ctx) => {
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    for (const c of MARK_SEGMENTS) {
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = MARK_STROKE * 1.7;
    ctx.lineCap = "round";
    for (const d of MARK_ANTENNAE) ctx.stroke(new Path2D(d));
  });
  W.points(scatter(m, Math.min(W.left, antsFor(maskArea(m), antSize, 1.05)), rng), WHITE);
  return W.finish(rng, antSize);
}

function trail({ w, h }: BuildCtx, n: number): Formation {
  const rng = mulberry32(3);
  const antSize = 9;
  const W = new Writer(n, w, h);
  const ctrl: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    ctrl.push([-0.06 * w + t * 1.12 * w, h * 0.5 + Math.sin(t * Math.PI * 2.1 + 0.5) * h * 0.3 + Math.sin(t * 9.0) * h * 0.04]);
  }
  const p = W.addPath(catmull(ctrl, 24), false);
  W.lane(p, 17, 62, -4.5, RED, rng);
  W.lane(p, 19, -54, 5, RED, rng);
  return W.finish(rng, antSize);
}

/* The three apps: an iPhone, a browser window and an Android phone. Exported so labels align. */

export type DeviceKind = "ios" | "web" | "android";
export interface DeviceRect {
  kind: DeviceKind;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

export function devicesGeometry(w: number, h: number): DeviceRect[] {
  if (w / h >= 1.6) {
    // Side by side on one baseline: phone, browser, phone.
    const H = h * 0.9;
    const pw = H * 0.48;
    const gap = Math.max(w * 0.04, 16);
    const bw = Math.min(w - pw * 2 - gap * 2 - 8, H * 1.75);
    const bh = Math.min(H * 0.8, bw / 1.45);
    const total = pw * 2 + bw + gap * 2;
    const x0 = (w - total) / 2;
    const base = (h + H) / 2;
    return [
      { kind: "ios", x: x0, y: base - H, w: pw, h: H, r: pw * 0.17 },
      { kind: "web", x: x0 + pw + gap, y: base - bh, w: bw, h: bh, r: Math.min(bw, bh) * 0.035 },
      { kind: "android", x: x0 + pw + gap + bw + gap, y: base - H, w: pw, h: H, r: pw * 0.11 },
    ];
  }
  // Narrow stages: the browser on top, the two phones below it.
  const bw = w * 0.94;
  const bh = Math.min(h * 0.34, bw / 1.5);
  const ph = Math.min(h * 0.48, (w * 0.8 - 24) / 2 / 0.48);
  const pw = ph * 0.48;
  const gap = Math.min(w * 0.14, Math.max(24, w * 0.94 - pw * 2 - w * 0.3));
  const px = (w - (pw * 2 + gap)) / 2;
  return [
    { kind: "web", x: (w - bw) / 2, y: h * 0.04, w: bw, h: bh, r: Math.min(bw, bh) * 0.04 },
    { kind: "ios", x: px, y: h * 0.96 - ph, w: pw, h: ph, r: pw * 0.17 },
    { kind: "android", x: px + pw + gap, y: h * 0.96 - ph, w: pw, h: ph, r: pw * 0.11 },
  ];
}

// Where each device's screen sits, inside the frame.
export function screenOf(d: DeviceRect) {
  if (d.kind === "web") {
    const bar = Math.max(d.h * 0.12, 18);
    const inset = d.w * 0.012;
    return { x: d.x + inset, y: d.y + bar, w: d.w - inset * 2, h: d.h - bar - inset, r: d.r * 0.6, bar };
  }
  const inset = d.w * 0.05;
  return { x: d.x + inset, y: d.y + inset, w: d.w - inset * 2, h: d.h - inset * 2, r: d.r * 0.8, bar: 0 };
}

// The hero keeps a whole Colony-sized crowd: 6,400 ants, or 3,136 on phones.
const HERO_ANTS = { desktop: 80 * 80, mobile: 56 * 56 };

function devices({ w, h, n, mobile }: BuildCtx): Formation {
  const rng = mulberry32(31);
  const antSize = mobile ? 6.5 : 8;
  const W = new Writer(Math.min(n, mobile ? HERO_ANTS.mobile : HERO_ANTS.desktop), w, h);
  const list = devicesGeometry(w, h);

  // Frames: ink ants marching around each device, both ways.
  for (const d of list) {
    const p = W.addPath(roundRectPts(d.x, d.y, d.w, d.h, d.r), true);
    W.lane(p, antSize * 1.45, 30, -2.6, INK, rng);
    W.lane(p, antSize * 1.45, -26, 2.6, INK, rng);
  }

  // Hardware details in ink: Dynamic Island, punch-hole camera, browser toolbar.
  const details = rasterMask(w, h, (ctx) => {
    for (const d of list) {
      const s = screenOf(d);
      if (d.kind === "ios") {
        roundRect(ctx, s.x + s.w * 0.33, s.y + s.h * 0.018, s.w * 0.34, s.h * 0.042, s.h * 0.021);
        ctx.fill();
      } else if (d.kind === "android") {
        ctx.beginPath();
        ctx.arc(s.x + s.w / 2, s.y + s.h * 0.035, s.w * 0.04, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const cy = d.y + s.bar * 0.5;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(d.x + d.w * 0.035 + k * d.w * 0.03, cy, Math.max(3, s.bar * 0.13), 0, Math.PI * 2);
          ctx.fill();
        }
        roundRect(ctx, d.x + d.w * 0.22, cy - s.bar * 0.16, d.w * 0.5, s.bar * 0.32, s.bar * 0.16);
        ctx.fill();
      }
    }
  });

  // The app on each screen, in red: a title and the welcome card, then a few rows (phones) or cards (web).
  // These take every ant the frames and details leave.
  const content = rasterMask(w, h, (ctx) => {
    for (const d of list) {
      const s = screenOf(d);
      const ix = s.x + s.w * 0.08;
      const iw = s.w * 0.84;
      if (d.kind === "web") {
        const top = s.y + s.h * 0.12;
        roundRect(ctx, ix, top, iw * 0.34, s.h * 0.075, 4);
        ctx.fill();
        roundRect(ctx, ix, top + s.h * 0.13, iw * 0.52, s.h * 0.035, 3);
        ctx.fill();
        const cardY = top + s.h * 0.27;
        const gap = iw * 0.04;
        const cw = (iw - gap * 2) / 3;
        for (let k = 0; k < 3; k++) {
          roundRect(ctx, ix + k * (cw + gap), cardY, cw, s.h * 0.38, Math.min(cw, s.h * 0.38) * 0.1);
          ctx.fill();
        }
        continue;
      }
      const top = s.y + s.h * 0.12;
      roundRect(ctx, ix, top, iw * 0.62, s.h * 0.045, 4);
      ctx.fill();
      const cardY = top + s.h * 0.08;
      const cardH = s.h * 0.2;
      roundRect(ctx, ix, cardY, iw, cardH, Math.min(iw, cardH) * 0.12);
      ctx.fill();
      const rowsTop = cardY + cardH + s.h * 0.05;
      for (let k = 0; k < 4; k++) {
        const y = rowsTop + k * s.h * 0.075;
        const dot = s.h * 0.018;
        ctx.beginPath();
        ctx.arc(ix + dot, y + dot, dot, 0, Math.PI * 2);
        ctx.fill();
        roundRect(ctx, ix + dot * 2.8, y + dot * 0.45, iw * (0.62 - (k % 2) * 0.16), dot * 1.1, dot * 0.5);
        ctx.fill();
      }
    }
  });

  W.points(scatter(details, Math.min(W.left, antsFor(maskArea(details), antSize, 1.3)), rng), INK);
  W.points(scatter(content, W.left, rng), RED);
  return W.finish(rng, antSize);
}

/* How a prompt becomes three apps. Exported so the station labels align. */

export function flowGeometry(w: number, h: number) {
  const vertical = h > w * 1.1;
  const at = (u: number, v: number): Pt => (vertical ? [w * (0.5 + (v - 0.5) * 0.9), h * u] : [w * u, h * v]);
  return {
    vertical,
    r: clamp(Math.min(w, h) * 0.055, 12, 30),
    prompt: at(0.06, 0.5),
    agents: at(0.24, 0.5),
    truth: at(0.42, 0.5),
    apps: [at(0.68, 0.17), at(0.68, 0.5), at(0.68, 0.83)],
    check: at(0.93, 0.5),
  };
}

function flow({ w, h, n, mobile }: BuildCtx): Formation {
  const rng = mulberry32(29);
  const antSize = mobile ? 6.5 : 8;
  const W = new Writer(n, w, h);
  const g = flowGeometry(w, h);
  const appR = g.r * 1.3;
  const edges: [Pt, number, Pt, number, number][] = [
    [g.prompt, g.r * 0.7, g.agents, g.r, RED],
    [g.agents, g.r, g.truth, g.r, RED],
    ...g.apps.map((a) => [g.truth, g.r, a, appR, RED] as [Pt, number, Pt, number, number]),
    ...g.apps.map((a) => [a, appR, g.check, g.r, INK] as [Pt, number, Pt, number, number]),
  ];
  for (const [a, ra, b, rb, tint] of edges) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const x0 = a[0] + ux * ra * 1.15, y0 = a[1] + uy * ra * 1.15;
    const x1 = b[0] - ux * rb * 1.15, y1 = b[1] - uy * rb * 1.15;
    const count = Math.max(2, Math.floor((len - ra - rb) / (antSize * 2.3)));
    const speed = 54 + rng() * 18;
    for (let k = 0; k < count; k++) W.segment(x0, y0, x1, y1, k / count + rng() * 0.04, speed, 0, tint);
  }
  const nodes = rasterMask(w, h, (ctx) => {
    const dot = (p: Pt, r: number) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(g.prompt, g.r * 0.7);
    dot(g.agents, g.r);
    dot(g.truth, g.r);
    dot(g.check, g.r);
  });
  const apps = rasterMask(w, h, (ctx) => {
    for (const a of g.apps) {
      ctx.beginPath();
      ctx.arc(a[0], a[1], appR, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  W.points(scatter(nodes, Math.min(W.left, antsFor(maskArea(nodes), antSize, 1.3)), rng), INK);
  W.points(scatter(apps, Math.min(W.left, antsFor(maskArea(apps), antSize, 1.3)), rng), RED);
  return W.finish(rng, antSize);
}

/* Acceptance criteria × platforms, as `make parity` reports them for the starter app. */

export const PARITY_ROWS = ["AC-home-1", "AC-home-2", "AC-home-3", "AC-settings-1", "AC-settings-2", "AC-settings-3", "AC-settings-4"];
export const PARITY_COLS = ["iOS", "Android", "Web"];
// [iOS, Android, Web]: true where that platform's tests name the criterion.
export const PARITY_TESTED: boolean[][] = [
  [false, false, true],
  [false, false, true],
  [false, false, false],
  [true, true, true],
  [true, true, true],
  [true, true, true],
  [true, true, true],
];

export function parityGrid(w: number, h: number, mobile: boolean) {
  const label = mobile ? w * 0.36 : w * 0.24;
  const rows = PARITY_ROWS.length;
  const colW = (w - label) / PARITY_COLS.length;
  const rowH = h / rows;
  const padX = Math.min(colW * 0.08, 10);
  const padY = Math.min(rowH * 0.14, 6);
  const cells = PARITY_TESTED.flatMap((row, r) =>
    row.map((tested, c) => ({ x: label + c * colW + padX, y: r * rowH + padY, w: colW - padX * 2, h: rowH - padY * 2, tested, r, c })),
  );
  return { label, colW, rowH, cells };
}

function parity({ w, h, n, mobile }: BuildCtx): Formation {
  const rng = mulberry32(41);
  const { cells, rowH } = parityGrid(w, h, mobile);
  const antSize = clamp(rowH * 0.3, 5.5, 8.5);
  const W = new Writer(n, w, h);
  const m = rasterMask(w, h, (ctx) => {
    for (const c of cells) {
      if (!c.tested) continue;
      roundRect(ctx, c.x, c.y, c.w, c.h, Math.min(c.h * 0.22, 6));
      ctx.fill();
    }
  });
  W.points(scatter(m, Math.min(W.left, antsFor(maskArea(m), antSize, 1.1)), rng), RED);
  return W.finish(rng, antSize);
}

export function buildFormation(name: FormationName, ctx: BuildCtx): Formation {
  switch (name) {
    case "mark": return mark(ctx);
    case "markwhite": return markwhite(ctx);
    case "trail": return trail(ctx, ctx.n);
    case "devices": return devices(ctx);
    case "flow": return flow(ctx);
    case "parity": return parity(ctx);
  }
}
