import * as THREE from "three";
import { GPUComputationRenderer, type Variable } from "three/addons/misc/GPUComputationRenderer.js";
import type { Formation } from "./formations";
import {
  MAX_STATIONS,
  PATH_ROWS,
  PATH_SAMPLES,
  antFragment,
  antVertex,
  positionShader,
  shadowFragment,
  velocityShader,
} from "./shaders";

export interface EngineOptions {
  sx: number;
  sy: number;
  dpr: number;
  calm: boolean;
}

export interface FrameInput {
  dt: number;
  scrollY: number;
  width: number;
  height: number;
  mouse: { x: number; y: number; on: boolean };
  stage: { x: number; y: number } | null;
}

// Raw sRGB components: the shaders write straight to the canvas without colour management.
const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

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
  private tPaths: THREE.DataTexture;
  private antMat: THREE.ShaderMaterial;
  private shadowMat: THREE.ShaderMaterial;
  private time = 0;
  private size = 10;
  private targetSize = 10;
  private lastStage: { x: number; y: number } | null = null;
  private pulse = new THREE.Vector4(0, 0, 99, 0);
  private snapFrames = 0;
  private w = 1;
  private h = 1;
  private calm = false;
  private geometry: THREE.InstancedBufferGeometry;

  constructor(canvas: HTMLCanvasElement, private opts: EngineOptions) {
    this.count = opts.sx * opts.sy;
    this.calm = opts.calm;
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

    const { sx, sy } = opts;
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
    this.tPaths = dataTex(PATH_SAMPLES, PATH_ROWS);
    // Hidden until the first formation arrives.
    (this.tB.image.data as Float32Array).fill(31);

    const shared = {
      uTA: { value: this.tA },
      uTB: { value: this.tB },
      uPaths: { value: this.tPaths },
      uStage: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uDtSec: { value: 1 / 60 },
      uHideX: { value: new THREE.Vector2(-80, 2000) },
      uBraid: { value: new THREE.Vector4() },
      uStations: { value: new Array(MAX_STATIONS).fill(-1) },
      uIntro: { value: new THREE.Vector4(0, 0, 0, 0) },
      uIntroGate: { value: -1e6 },
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
      uCarry: { value: new THREE.Vector2() },
      uSnap: { value: 0 },
      uViewTop: { value: 0 },
      uViewH: { value: 1000 },
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
    this.geometry = geo;

    const antUniforms = {
      tPos: { value: null as THREE.Texture | null },
      tVel: { value: null as THREE.Texture | null },
      uSize: { value: 10 },
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
    this.velVar.material.uniforms.uHideX.value.set(-90, width + 90);
  }

  // Calm: no wander, no cursor, and the clock stops so marching lanes hold still.
  setCalm(calm: boolean) {
    this.calm = calm;
    this.velVar.material.uniforms.uCalm.value = calm ? 1 : 0;
  }

  // Draw only a fraction of the colony (slow devices).
  setDensity(fraction: number) {
    this.geometry.instanceCount = Math.max(1, Math.round(this.count * fraction));
  }

  // Seed every ant around one point (page coords), e.g. the nav logo.
  spawnAt(x: number, y: number, spread = 8) {
    const pos = this.gpu.createTexture();
    const vel = this.gpu.createTexture();
    const p = pos.image.data as Float32Array;
    const v = vel.image.data as Float32Array;
    for (let i = 0; i < this.count; i++) {
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

  // Route every ant through a waypoint (page coords) before it takes its place.
  intro(x: number, y: number, gateX: number) {
    this.velVar.material.uniforms.uIntro.value.set(x, -y, this.time, 1);
    this.velVar.material.uniforms.uIntroGate.value = gateX;
  }

  setFormation(f: Formation, snap = false) {
    (this.tA.image.data as Float32Array).set(f.a);
    (this.tB.image.data as Float32Array).set(f.b);
    this.tA.needsUpdate = true;
    this.tB.needsUpdate = true;
    const pd = this.tPaths.image.data as Float32Array;
    f.paths.forEach((p, row) => {
      for (let s = 0; s < PATH_SAMPLES; s++) {
        const k = (row * PATH_SAMPLES + s) * 4;
        pd[k] = p.pts[s * 2];
        pd[k + 1] = p.pts[s * 2 + 1];
        pd[k + 2] = p.closed ? 1 : 0;
        pd[k + 3] = p.length;
      }
    });
    this.tPaths.needsUpdate = true;
    const u = this.velVar.material.uniforms;
    if (f.braid) {
      u.uBraid.value.set(1, f.braid.gap, f.braid.min, 0);
      const st = u.uStations.value as number[];
      for (let i = 0; i < MAX_STATIONS; i++) st[i] = f.braid.stations[i] ?? -1;
    } else {
      u.uBraid.value.set(0, 0, 0, 0);
    }
    this.targetSize = f.antSize;
    this.lastStage = null;
    if (snap) {
      this.size = f.antSize;
      this.snapFrames = 2;
    }
  }

  kick(x: number, y: number, strength = 5) {
    this.pulse.set(x, -y, 0, strength);
  }

  frame({ dt, scrollY, width, height, mouse, stage }: FrameInput) {
    const step = Math.min(dt, 1 / 20);
    if (!this.calm) this.time += step;
    const f = step * 60;
    this.size += (this.targetSize - this.size) * (1 - Math.pow(0.94, f));

    const vu = this.velVar.material.uniforms;
    const pu = this.posVar.material.uniforms;
    vu.uTime.value = this.time;
    vu.uDtSec.value = step;
    vu.uDt.value = f;
    pu.uDt.value = f;
    pu.uViewTop.value = -scrollY;
    pu.uViewH.value = height;
    this.pulse.z += step;
    const intro = vu.uIntro.value as THREE.Vector4;
    if (intro.w > 0 && this.time > intro.z + 2.6) intro.w = 0;

    if (stage) {
      const sx = stage.x, sy = -stage.y;
      if (this.lastStage) pu.uCarry.value.set(sx - this.lastStage.x, sy - this.lastStage.y);
      else pu.uCarry.value.set(0, 0);
      this.lastStage = { x: sx, y: sy };
      vu.uStage.value.set(sx, sy);
    } else {
      pu.uCarry.value.set(0, 0);
    }
    vu.uMouse.value.set(mouse.x, -(mouse.y + scrollY));
    vu.uMouseOn.value += ((mouse.on && !this.calm ? 1 : 0) - vu.uMouseOn.value) * 0.15;
    pu.uSnap.value = this.snapFrames > 0 ? 1 : 0;
    if (this.snapFrames > 0) this.snapFrames--;

    this.gpu.compute();

    this.antMat.uniforms.tPos.value = this.gpu.getCurrentRenderTarget(this.posVar).texture;
    this.antMat.uniforms.tVel.value = this.gpu.getCurrentRenderTarget(this.velVar).texture;
    this.antMat.uniforms.uSize.value = this.size;
    this.antMat.uniforms.uTime.value = this.time;

    if (width !== this.w || height !== this.h) this.resize(width, height, this.renderer.getPixelRatio());
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = -scrollY;
    this.camera.bottom = -scrollY - height;
    this.camera.updateProjectionMatrix();
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.gpu.dispose();
    this.tA.dispose();
    this.tB.dispose();
    this.tPaths.dispose();
    this.antMat.dispose();
    this.shadowMat.dispose();
    this.renderer.dispose();
  }
}
