// GLSL for the colony. The simulation runs in page space (CSS px, y up,
// world y = -pageY) so formations stay pinned to the document as it scrolls.

export const PATH_SAMPLES = 512;
export const PATH_ROWS = 16;
export const MAX_STAGES = 8;

const common = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 permute3(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 curl(vec2 p, float t) {
  const float e = 0.12;
  vec2 o = vec2(t, t * 0.7);
  float n1 = snoise(vec2(p.x, p.y + e) + o);
  float n2 = snoise(vec2(p.x, p.y - e) + o);
  float n3 = snoise(vec2(p.x + e, p.y) + o);
  float n4 = snoise(vec2(p.x - e, p.y) + o);
  return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
}
`;

// Per-ant formation data, relative to the centre of the ant's own stage:
//   uTA   static  (x, y, 0, 0)          segment (x0, y0, x1, y1)     path (row, closed, length, 0)
//   uTB   (u0, cyclesPerSecond, lateralOffset, tint + 10 * type)
//   uMeta (stage slot, ant size, snap, 0)
//   type 0 static, 1 segment, 2 path, 3 spare. tint 0 ink, 1 red, 2 white.
const target = /* glsl */ `
uniform sampler2D uTA;
uniform sampler2D uTB;
uniform sampler2D uMeta;
uniform sampler2D uPaths;
uniform vec2 uStages[${MAX_STAGES}]; // each stage's centre
uniform float uTime;
uniform float uDtSec;

struct Tgt {
  vec2 pos;
  vec2 vel;
  float vis;
  float type;
  float tint;
  float wrapped;
  int stage;
  float snap;
};

vec2 pathPoint(float row, float u) {
  float fx = clamp(u, 0.0, 1.0) * ${(PATH_SAMPLES - 1).toFixed(1)};
  float i0 = floor(fx);
  float f = fx - i0;
  float i1 = min(i0 + 1.0, ${(PATH_SAMPLES - 1).toFixed(1)});
  float v = (row + 0.5) / ${PATH_ROWS.toFixed(1)};
  vec2 p0 = texture2D(uPaths, vec2((i0 + 0.5) / ${PATH_SAMPLES.toFixed(1)}, v)).xy;
  vec2 p1 = texture2D(uPaths, vec2((i1 + 0.5) / ${PATH_SAMPLES.toFixed(1)}, v)).xy;
  return mix(p0, p1, f);
}

Tgt getTarget(vec2 uv, vec2 cur) {
  vec4 a = texture2D(uTA, uv);
  vec4 b = texture2D(uTB, uv);
  vec4 m = texture2D(uMeta, uv);
  float type = floor(b.w / 10.0 + 0.001);
  Tgt t;
  t.type = type;
  t.tint = b.w - type * 10.0;
  t.vis = 1.0;
  t.vel = vec2(0.0);
  t.wrapped = 0.0;
  t.stage = int(clamp(m.x, 0.0, ${(MAX_STAGES - 1).toFixed(1)}) + 0.5);
  t.snap = m.z;
  vec2 c = uStages[t.stage];
  t.pos = c + a.xy;
  if (type > 0.5 && type < 1.5) {
    float u = fract(b.x + uTime * b.y);
    float up = fract(b.x + (uTime - uDtSec) * b.y);
    t.wrapped = step(0.5, abs(u - up));
    vec2 d = a.zw - a.xy;
    float len = max(length(d), 0.0001);
    vec2 n = vec2(-d.y, d.x) / len;
    t.pos = c + mix(a.xy, a.zw, u) + n * b.z;
    t.vel = d * b.y / 60.0;
    t.vis = smoothstep(0.0, 0.08, u) * smoothstep(1.0, 0.92, u);
  } else if (type > 1.5 && type < 2.5) {
    float u = fract(b.x + uTime * b.y);
    float up = fract(b.x + (uTime - uDtSec) * b.y);
    vec2 p = pathPoint(a.x, u);
    vec2 tg = pathPoint(a.x, u + 0.002) - pathPoint(a.x, u - 0.002);
    float tl = length(tg);
    vec2 tn = tl > 0.00001 ? tg / tl : vec2(1.0, 0.0);
    vec2 n = vec2(-tn.y, tn.x);
    t.pos = c + p + n * b.z;
    t.vel = tn * sign(b.y) * abs(b.y) * a.z / 60.0;
    if (a.y < 0.5) {
      t.wrapped = step(0.5, abs(u - up));
      t.vis = smoothstep(0.0, 0.025, u) * smoothstep(1.0, 0.975, u);
    }
  } else if (type > 2.5) {
    // A spare ant stays where it is, unseen.
    t.pos = cur;
    t.vis = 0.0;
  }
  return t;
}
`;

export const velocityShader = /* glsl */ `
${common}
${target}
uniform float uDt;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform vec4 uPulse;
uniform float uMaxSpeed;
uniform float uMaxForce;
uniform float uDamping;
uniform float uWanderRest;
uniform float uWanderTravel;
uniform float uArrive;
uniform float uCalm;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  Tgt T = getTarget(uv, P.xy);
  if (T.type > 2.5) {
    // Spare ants slow to a stop and fade out where they are.
    V.xy *= pow(0.8, uDt);
    V.w = mix(V.w, 0.0, 1.0 - pow(0.93, uDt));
    gl_FragColor = V;
    return;
  }
  float seed = hash12(uv * 311.7);

  vec2 to = T.pos - P.xy;
  float d = length(to);
  float ms = uMaxSpeed * mix(0.7, 1.3, seed) * (1.0 + smoothstep(260.0, 1400.0, d) * 1.6);
  vec2 desired = T.vel;
  if (d > 0.001) desired += to / d * ms * smoothstep(0.0, uArrive, d);
  vec2 steer = desired - V.xy;
  float mf = uMaxForce * mix(0.7, 1.3, fract(seed * 13.7));
  float sl = length(steer);
  if (sl > mf) steer *= mf / sl;

  float travel = smoothstep(4.0, 160.0, d);
  vec2 w = curl(P.xy * 0.0042 + seed * 9.0, uTime * 0.22 + seed * 2.0);
  w *= 1.0 / max(length(w), 0.35);
  steer += w * mix(uWanderRest, uWanderTravel, travel) * (1.0 - uCalm);

  vec2 dm = P.xy - uMouse;
  float md = length(dm);
  float fall = 1.0 - smoothstep(0.0, 130.0, md);
  steer += (dm / max(md, 0.001)) * fall * fall * 2.6 * uMouseOn * (1.0 - uCalm);

  if (uPulse.z < 0.4) {
    vec2 dp = P.xy - uPulse.xy;
    float pd = length(dp);
    float ring = 1.0 - smoothstep(0.0, 300.0, pd);
    steer += (dp / max(pd, 0.001)) * ring * uPulse.w * (1.0 - uPulse.z / 0.4);
  }

  V.xy += steer * uDt;
  V.xy *= pow(uDamping, uDt);
  float sp = length(V.xy);
  float cap = ms * 1.8 + length(T.vel);
  if (sp > cap) V.xy *= cap / sp;
  V.w = mix(V.w, T.vis, 1.0 - pow(T.vis > V.w ? 0.9 : 0.93, uDt));
  gl_FragColor = V;
}
`;

export const positionShader = /* glsl */ `
${common}
${target}
uniform float uDt;
uniform vec2 uCarry[${MAX_STAGES}]; // how far each stage moved since the last frame
uniform float uSnap;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  Tgt T = getTarget(uv, P.xy);

  // Ants ride along when their stage moves.
  if (T.type < 2.5) P.xy += uCarry[T.stage];
  P.xy += V.xy * uDt;
  P.z = mod(P.z + length(V.xy) * uDt * 0.85, 6283.1853);
  P.w = mix(P.w, T.tint, 1.0 - pow(0.95, uDt));

  if (T.wrapped > 0.5) P.xy = T.pos;
  // Placed, not walked: on load, and when a resize moves an ant to another stage.
  if (uSnap > 0.5 && T.snap > 0.5) {
    P.xy = T.pos;
    P.w = T.tint;
  }
  gl_FragColor = P;
}
`;

const antVaryings = /* glsl */ `
varying vec2 vLocal;
varying float vPhase;
varying float vTint;
varying vec3 vLight;
varying vec2 vShadow;
varying float vPx;
varying float vVis;
`;

export const antVertex = /* glsl */ `
${common}
${antVaryings}
uniform sampler2D tPos;
uniform sampler2D tVel;
uniform sampler2D tMeta;
uniform float uDensity;
uniform float uDpr;
uniform float uTime;
attribute vec2 aRef;

void main() {
  vec4 P = texture2D(tPos, aRef);
  vec4 V = texture2D(tVel, aRef);
  vec4 M = texture2D(tMeta, aRef);
  float seed = hash12(aRef * 311.7);
  float sp = length(V.xy);
  float fa = seed * 6.2831 + uTime * (0.08 + seed * 0.1);
  vec2 fallback = vec2(cos(fa), sin(fa));
  vec2 dir = sp > 0.00001 ? V.xy / sp : fallback;
  dir = normalize(mix(fallback, dir, smoothstep(0.015, 0.3, sp)) + vec2(0.00001));
  vec2 perp = vec2(-dir.y, dir.x);
  float vis = clamp(V.w, 0.0, 1.0);
  // Slow devices draw a random share of every stage's ants.
  float drawn = step(hash12(aRef * 57.3), uDensity);
  float size = M.y * mix(0.84, 1.16, seed) * smoothstep(0.0, 1.0, vis) * drawn;
  vec2 q = position.xy * vec2(1.5, 1.24);
  vLocal = q;
  vec2 world = P.xy + (dir * q.x + perp * q.y) * size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 0.0, 1.0);
  vPhase = P.z + seed * 6.2831;
  vTint = P.w;
  vec3 L = normalize(vec3(-0.42, 0.62, 0.78));
  vLight = vec3(dot(L.xy, dir), dot(L.xy, perp), L.z);
  vec2 sh = vec2(0.07, -0.13);
  vShadow = vec2(dot(sh, dir), dot(sh, perp));
  vPx = max(size * uDpr, 0.0001);
  vVis = vis;
}
`;

const antShape = /* glsl */ `
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdEl(vec2 p, vec2 c, vec2 r) {
  vec2 q = (p - c) / r;
  return (length(q) - 1.0) * min(r.x, r.y);
}
const vec2 G_C = vec2(-0.265, 0.0);  const vec2 G_R = vec2(0.205, 0.142);
const vec2 N_C = vec2(-0.072, 0.0);  const vec2 N_R = vec2(0.044, 0.036);
const vec2 T_C = vec2(0.075, 0.0);   const vec2 T_R = vec2(0.135, 0.066);
const vec2 H_C = vec2(0.285, 0.0);   const vec2 H_R = vec2(0.098, 0.09);

float bodyDist(vec2 p) {
  float d = sdEl(p, G_C, G_R);
  d = min(d, sdEl(p, N_C, N_R));
  d = min(d, sdEl(p, T_C, T_R));
  d = min(d, sdEl(p, H_C, H_R));
  return d;
}
`;

export const antFragment = /* glsl */ `
${antVaryings}
${antShape}
uniform vec3 uInk;
uniform vec3 uRed;
uniform vec3 uWhite;

vec3 tintColor(float t) {
  return t < 1.0 ? mix(uInk, uRed, clamp(t, 0.0, 1.0)) : mix(uRed, uWhite, clamp(t - 1.0, 0.0, 1.0));
}

vec3 partNormal(vec2 p, vec2 c, vec2 r) {
  vec2 q = (p - c) / r;
  float h = sqrt(max(1.0 - dot(q, q), 0.0));
  return normalize(vec3(q.x / r.x, q.y / r.y, h / r.y));
}

void main() {
  vec2 p = vLocal;
  float aa = 1.0 / vPx;

  float dG = sdEl(p, G_C, G_R);
  float dN = sdEl(p, N_C, N_R);
  float dT = sdEl(p, T_C, T_R);
  float dH = sdEl(p, H_C, H_R);
  float body = min(min(dG, dN), min(dT, dH));

  vec2 q = vec2(p.x, abs(p.y));
  float left = step(0.0, p.y);
  float s1 = sin(vPhase);
  float s2 = -s1;
  float sf = mix(s2, s1, left);
  float sm = -sf;
  float legs = 1e3;
  vec2 k1 = vec2(0.21 + 0.035 * sf, 0.17);
  vec2 f1 = vec2(0.33 + 0.07 * sf, 0.265);
  legs = min(legs, sdSeg(q, vec2(0.13, 0.035), k1));
  legs = min(legs, sdSeg(q, k1, f1));
  vec2 k2 = vec2(0.075 + 0.03 * sm, 0.2);
  vec2 f2 = vec2(0.045 + 0.08 * sm, 0.335);
  legs = min(legs, sdSeg(q, vec2(0.075, 0.045), k2));
  legs = min(legs, sdSeg(q, k2, f2));
  vec2 k3 = vec2(-0.05 + 0.03 * sf, 0.185);
  vec2 f3 = vec2(-0.21 + 0.07 * sf, 0.315);
  legs = min(legs, sdSeg(q, vec2(0.02, 0.045), k3));
  legs = min(legs, sdSeg(q, k3, f3));
  float tw = 0.012 * sin(vPhase * 0.37 + left * 2.0);
  vec2 e1 = vec2(0.425, 0.115 + tw);
  legs = min(legs, sdSeg(q, vec2(0.35, 0.035), e1));
  legs = min(legs, sdSeg(q, e1, vec2(0.545, 0.14 + tw * 2.0)));

  float legW = max(0.017, 0.45 * aa);
  float aBody = 1.0 - smoothstep(-aa, aa, body);
  float aLegs = (1.0 - smoothstep(-aa, aa, legs - legW)) * clamp(legW * vPx * 1.6, 0.35, 1.0);

  vec3 n = partNormal(p, G_C, G_R);
  if (dT < dG && dT < dH && dT < dN) n = partNormal(p, T_C, T_R);
  if (dH < dG && dH < dT && dH < dN) n = partNormal(p, H_C, H_R);
  if (dN < dG && dN < dT && dN < dH) n = partNormal(p, N_C, N_R);

  vec3 L = normalize(vLight);
  float diff = max(dot(n, L), 0.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 42.0);
  float rim = pow(1.0 - n.z, 2.0);

  vec3 base = tintColor(vTint);
  float white = clamp(vTint - 1.0, 0.0, 1.0);
  vec3 lit = base * mix(0.5 + 0.62 * diff, 0.84 + 0.18 * diff, white);
  lit *= 1.0 - rim * mix(0.35, 0.12, white);
  lit += vec3(spec) * mix(0.55, 0.25, white);
  vec3 legCol = base * mix(0.62, 0.9, white);

  float alpha = max(aBody, aLegs);
  vec3 col = mix(legCol, lit, aBody);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

export const shadowFragment = /* glsl */ `
${antVaryings}
${antShape}
uniform vec3 uShadowLight;
uniform vec3 uShadowDark;
uniform float uShadowAlpha;

void main() {
  vec2 p = vLocal - vShadow;
  float d = bodyDist(p * vec2(1.0, 0.94));
  float soft = 0.05 + 1.2 / vPx;
  float a = 1.0 - smoothstep(-soft, soft * 1.6, d);
  float white = clamp(vTint - 1.0, 0.0, 1.0);
  a *= uShadowAlpha * mix(1.0, 1.7, white);
  if (a < 0.003) discard;
  gl_FragColor = vec4(mix(uShadowLight, uShadowDark, white), a);
}
`;
