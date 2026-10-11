import * as THREE from "three";
import { GPUComputationRenderer, type Variable } from "three/addons/misc/GPUComputationRenderer.js";
import type { Formation } from "./formations";
import {
  MAX_STAGES,
  PATH_ROWS,
  PATH_SAMPLES,
  antFragment,
  antVertex,
  positionShader,
  shadowFragment,
  velocityShader,
} from "./shaders";

export { MAX_STAGES };

export interface EngineOptions {
  count: number;
  dpr: number;
  calm: boolean;
}

export interface FrameInput {
  dt: number;
  scrollY: number;
  // The page area the canvas covers: its top edge in page coords, and its size.
  top: number;
  width: number;
  height: number;
  mouse: { x: number; y: number; on: boolean };
  // The centre of each stage slot in page coords, or null when that slot is empty.
  stages: ({ x: number; y: number } | null)[];
}

// One stage's share of the colony: the slot that holds its centre, and its formation.
export interface StagePlan {
  slot: number;
  formation: Formation;
}

// Raw sRGB components: the shaders write straight to the canvas without colour management.
const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

// uTB.w for an ant no stage is using: type 3 (spare), tint red.
const SPARE = 3 * 10 + 1;

export function supportsColony(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    const ok = !!gl.getExtension("EXT_color_buffer_float") && gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export class ColonyEngine {
  readonly count: number;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  private gpu: GPUComputationRenderer;
  private posVar: Variable;
  private velVar: Variable;
  private tA: THREE.DataTexture;
  private tB: THREE.DataTexture;
  private tMeta: THREE.DataTexture;
  private tPaths: THREE.DataTexture;
  private antMat: THREE.ShaderMaterial;
  private shadowMat: THREE.ShaderMaterial;
  private time = 0;
  private pulse = new THREE.Vector4(0, 0, 99, 0);
  private snapFrames = 0;
  private w = 1;
  private h = 1;
  private calm = false;
  // The stage slot each ant belongs to (-1: spare), and which slots had a centre last frame.
  private slotOf: Int16Array;
  private placed: boolean[] = new Array(MAX_STAGES).fill(false);

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions) {
    const sx = Math.ceil(Math.sqrt(opts.count));
    const sy = Math.ceil(opts.count / sx);
    this.count = sx * sy;
    this.calm = opts.calm;
    this.slotOf = new Int16Array(this.count).fill(-1);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(opts.dpr);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    this.gpu = new GPUComputationRenderer(sx, sy, this.renderer);

    const pos0 = this.gpu.createTexture();
    const vel0 = this.gpu.createTexture();
    this.posVar = this.gpu.addVariable("texturePosition", positionShader, pos0);
    this.velVar = this.gpu.addVariable("textureVelocity", velocityShader, vel0);
    this.gpu.setVariableDependencies(this.posVar, [this.posVar, this.velVar]);
    this.gpu.setVariableDependencies(this.velVar, [this.posVar, this.velVar]);

    const dataTex = (w: number, h: number) => {
      const t = new THREE.DataTexture(new Float32Array(w * h * 4), w, h, THREE.RGBAFormat, THREE.FloatType);
      t.minFilter = t.magFilter = THREE.NearestFilter;
      t.needsUpdate = true;
      return t;
    };
    this.tA = dataTex(sx, sy);
    this.tB = dataTex(sx, sy);
    this.tMeta = dataTex(sx, sy);
    this.tPaths = dataTex(PATH_SAMPLES, PATH_ROWS);
    // Spare until the stages are laid out.
    (this.tB.image.data as Float32Array).fill(SPARE);

    const shared = {
      uTA: { value: this.tA },
      uTB: { value: this.tB },
      uMeta: { value: this.tMeta },
      uPaths: { value: this.tPaths },
      uStages: { value: Array.from({ length: MAX_STAGES }, () => new THREE.Vector2()) },
      uTime: { value: 0 },
      uDtSec: { value: 1 / 60 },
      uIntro: { value: new THREE.Vector4(0, 0, 0, 0) },
      uIntroGate: { value: -1e6 },
      uIntroStage: { value: -1 },
      uDt: { value: 1 },
    };
    const vu = this.velVar.material.uniforms;
    const pu = this.posVar.material.uniforms;
    Object.assign(vu, shared, {
      uMouse: { value: new THREE.Vector2(-9999, -9999) },
      uMouseOn: { value: 0 },
      uPulse: { value: this.pulse },
      uMaxSpeed: { value: 13 },
      uMaxForce: { value: 1.05 },
      uDamping: { value: 0.9 },
      uWanderRest: { value: 0.07 },
      uWanderTravel: { value: 0.32 },
      uArrive: { value: 70 },
      uCalm: { value: opts.calm ? 1 : 0 },
    });
    // Position and velocity passes must not share uniform objects that differ; the
    // shared ones are identical references on purpose.
    Object.assign(pu, shared, {
      uCarry: { value: Array.from({ length: MAX_STAGES }, () => new THREE.Vector2()) },
      uSnap: { value: 0 },
    });

    const err = this.gpu.init();
    if (err) throw new Error(err);

    const quad = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute("position", quad.getAttribute("position"));
    const refs = new Float32Array(this.count * 2);
    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        const i = y * sx + x;
        refs[i * 2] = (x + 0.5) / sx;
        refs[i * 2 + 1] = (y + 0.5) / sy;
      }
    }
    geo.setAttribute("aRef", new THREE.InstancedBufferAttribute(refs, 2));
    geo.instanceCount = this.count;

    const antUniforms = {
      tPos: { value: null as THREE.Texture | null },
      tVel: { value: null as THREE.Texture | null },
      tMeta: { value: this.tMeta },
      uDensity: { value: 1 },
      uDpr: { value: opts.dpr },
      uTime: { value: 0 },
    };
    this.antMat = new THREE.ShaderMaterial({
      uniforms: {
        ...antUniforms,
        uInk: { value: hex("#151313") },
        uRed: { value: hex("#CA0515") },
        uWhite: { value: hex("#FFFFFF") },
      },
      vertexShader: antVertex,
      fragmentShader: antFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: {
        ...antUniforms,
        uShadowLight: { value: hex("#3a1010") },
        uShadowDark: { value: hex("#4a0006") },
        uShadowAlpha: { value: 0.2 },
      },
      vertexShader: antVertex,
      fragmentShader: shadowFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    // Share the same uniform objects so one update drives both passes.
    for (const k of Object.keys(antUniforms)) this.shadowMat.uniforms[k] = this.antMat.uniforms[k];

    const shadows = new THREE.Mesh(geo, this.shadowMat);
    const ants = new THREE.Mesh(geo, this.antMat);
    shadows.frustumCulled = ants.frustumCulled = false;
    shadows.renderOrder = 0;
    ants.renderOrder = 1;
    this.scene.add(shadows, ants);
  }

  resize(width: number, height: number, dpr: number) {
    this.w = width;
    this.h = height;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, true);
    this.antMat.uniforms.uDpr.value = dpr;
  }

  // Calm: no wander, no cursor, and the clock stops so marching lanes hold still.
  setCalm(calm: boolean) {
    this.calm = calm;
    this.velVar.material.uniforms.uCalm.value = calm ? 1 : 0;
  }

  // Draw only a fraction of the colony (slow devices).
  setDensity(fraction: number) {
    this.antMat.uniforms.uDensity.value = fraction;
  }

  // Give each stage its own run of ants, placed straight onto their spots: ants never
  // walk from one stage to another, or across a stage when it is rebuilt after a resize.
  // `hold` names a slot whose ants are left where they are, for the intro to bring in.
  // Returns how many ants each slot got.
  setStages(plans: StagePlan[], hold = -1) {
    const A = this.tA.image.data as Float32Array;
    const B = this.tB.image.data as Float32Array;
    const M = this.tMeta.image.data as Float32Array;
    const P = this.tPaths.image.data as Float32Array;
    const total = plans.reduce((n, p) => n + p.formation.used, 0);
    // A window that grew a lot can ask for more ants than there are: every stage gives up a share.
    const scale = total > this.count ? this.count / total : 1;
    const counts = new Map<number, number>();
    let i = 0;
    let row = 0;
    for (const { slot, formation: f } of plans) {
      const firstRow = row;
      for (const p of f.paths) {
        if (row >= PATH_ROWS) break;
        for (let s = 0; s < PATH_SAMPLES; s++) {
          const k = (row * PATH_SAMPLES + s) * 4;
          P[k] = p.pts[s * 2];
          P[k + 1] = p.pts[s * 2 + 1];
          P[k + 2] = p.closed ? 1 : 0;
          P[k + 3] = p.length;
        }
        row++;
      }
      const n = Math.min(Math.floor(f.used * scale), this.count - i);
      for (let k = 0; k < n; k++, i++) {
        const src = k * 4;
        const dst = i * 4;
        A.set(f.a.subarray(src, src + 4), dst);
        B.set(f.b.subarray(src, src + 4), dst);
        // Path ants name their stage's own rows; shift them to where those rows landed.
        if (Math.floor(B[dst + 3] / 10 + 0.001) === 2) {
          A[dst] += firstRow;
          if (A[dst] >= row) B[dst + 3] = SPARE;
        }
        M[dst] = slot;
        M[dst + 1] = f.antSize;
        M[dst + 2] = slot === hold ? 0 : 1;
        M[dst + 3] = 0;
        this.slotOf[i] = slot;
      }
      counts.set(slot, n);
    }
    for (; i < this.count; i++) {
      const dst = i * 4;
      A.fill(0, dst, dst + 4);
      B.fill(0, dst, dst + 3);
      B[dst + 3] = SPARE;
      M.fill(0, dst, dst + 4);
      this.slotOf[i] = -1;
    }
    this.tA.needsUpdate = this.tB.needsUpdate = this.tMeta.needsUpdate = this.tPaths.needsUpdate = true;
    this.snapFrames = 2;
    return counts;
  }

  // Seed one stage's ants around a point (page coords), e.g. the nav logo. Call it right after
  // setStages: every other ant starts at the origin, and setStages has flagged them to be placed.
  spawnAt(x: number, y: number, spread: number, slot: number) {
    const pos = this.gpu.createTexture();
    const vel = this.gpu.createTexture();
    const p = pos.image.data as Float32Array;
    const v = vel.image.data as Float32Array;
    for (let i = 0; i < this.count; i++) {
      if (this.slotOf[i] !== slot) continue;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * spread;
      p[i * 4] = x + Math.cos(a) * r;
      p[i * 4 + 1] = -(y + Math.sin(a) * r);
      p[i * 4 + 2] = Math.random() * 6.28;
      p[i * 4 + 3] = 1;
      const s = 0.5 + Math.random() * 4;
      v[i * 4] = Math.cos(a) * s;
      v[i * 4 + 1] = Math.sin(a) * s;
      v[i * 4 + 3] = 0;
    }
    for (const t of [pos, vel]) t.needsUpdate = true;
    for (const rt of this.posVar.renderTargets) this.gpu.renderTexture(pos, rt);
    for (const rt of this.velVar.renderTargets) this.gpu.renderTexture(vel, rt);
    pos.dispose();
    vel.dispose();
  }

  // Route one stage's ants through a waypoint (page coords) before they take their places.
  intro(x: number, y: number, gateX: number, slot: number) {
    const u = this.velVar.material.uniforms;
    u.uIntro.value.set(x, -y, this.time, 1);
    u.uIntroGate.value = gateX;
    u.uIntroStage.value = slot;
  }

  kick(x: number, y: number, strength = 5) {
    this.pulse.set(x, -y, 0, strength);
  }

  frame({ dt, scrollY, top, width, height, mouse, stages }: FrameInput) {
    const step = Math.min(dt, 1 / 20);
    if (!this.calm) this.time += step;
    const f = step * 60;

    const vu = this.velVar.material.uniforms;
    const pu = this.posVar.material.uniforms;
    vu.uTime.value = this.time;
    vu.uDtSec.value = step;
    vu.uDt.value = f;
    pu.uDt.value = f;
    this.pulse.z += step;
    const intro = vu.uIntro.value as THREE.Vector4;
    if (intro.w > 0 && this.time > intro.z + 2.6) intro.w = 0;

    // Stages are pinned to the page, but layout shifts move them: their ants ride along.
    const centres = vu.uStages.value as THREE.Vector2[];
    const carry = pu.uCarry.value as THREE.Vector2[];
    for (let s = 0; s < MAX_STAGES; s++) {
      const c = stages[s];
      if (!c) {
        carry[s].set(0, 0);
        this.placed[s] = false;
        continue;
      }
      if (this.placed[s]) carry[s].set(c.x - centres[s].x, -c.y - centres[s].y);
      else carry[s].set(0, 0);
      centres[s].set(c.x, -c.y);
      this.placed[s] = true;
    }
    vu.uMouse.value.set(mouse.x, -(mouse.y + scrollY));
    vu.uMouseOn.value += ((mouse.on && !this.calm ? 1 : 0) - vu.uMouseOn.value) * 0.15;
    pu.uSnap.value = this.snapFrames > 0 ? 1 : 0;
    if (this.snapFrames > 0) this.snapFrames--;

    this.gpu.compute();

    this.antMat.uniforms.tPos.value = this.gpu.getCurrentRenderTarget(this.posVar).texture;
    this.antMat.uniforms.tVel.value = this.gpu.getCurrentRenderTarget(this.velVar).texture;
    this.antMat.uniforms.uTime.value = this.time;

    if (width !== this.w || height !== this.h) this.resize(width, height, this.renderer.getPixelRatio());
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = -top;
    this.camera.bottom = -top - height;
    this.camera.updateProjectionMatrix();
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.gpu.dispose();
    this.tA.dispose();
    this.tB.dispose();
    this.tMeta.dispose();
    this.tPaths.dispose();
    this.antMat.dispose();
    this.shadowMat.dispose();
    this.renderer.dispose();
  }
}
