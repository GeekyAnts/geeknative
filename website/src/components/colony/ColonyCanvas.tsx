"use client";

import { useEffect, useRef } from "react";
import type { ColonyEngine, StagePlan } from "@/lib/colony/engine";
import type { Formation, FormationName } from "@/lib/colony/formations";
import { colonyStore } from "@/lib/colony/store";

// The most ants one stage may ask for.
const STAGE_MAX = 1 << 14;

interface Measured {
  id: string;
  formation: FormationName;
  rect: DOMRect;
}

const visible = (r: DOMRect) => r.width >= 4 && r.height >= 4;

// The canvas scrolls with the page instead of sitting fixed over it. The browser
// scrolls natively, off the main thread, so a fixed canvas redrawn every frame
// would trail the page. It covers the viewport plus this share of it above and
// below, and moves along each frame.
const OVERSCAN = 0.3;
const canvasHeight = (vh: number) => vh + Math.round(vh * OVERSCAN) * 2;

// Owns the colony's canvas. Every stage on the page gets its own ants, and they
// stay there: they march and mill about in their own section and never travel to
// another one as the page scrolls.
export function ColonyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let raf = 0;
    let engine: ColonyEngine | null = null;
    const off: (() => void)[] = [];

    try {
      if (localStorage.getItem("gn-colony") === "0") colonyStore.enabled = false;
    } catch {}

    (async () => {
      const [{ ColonyEngine, MAX_STAGES, supportsColony }, { buildFormation }] = await Promise.all([
        import("@/lib/colony/engine"),
        import("@/lib/colony/formations"),
      ]);
      if (disposed) return;
      if (!supportsColony()) {
        colonyStore.setStatus("unsupported");
        return;
      }

      const small = matchMedia("(max-width: 767px)").matches;
      const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      const cache = new Map<string, Formation>();
      const formationFor = (name: FormationName, w: number, h: number) => {
        const key = `${name}|${Math.round(w)}x${Math.round(h)}`;
        let f = cache.get(key);
        if (!f) {
          if (cache.size >= 40) cache.clear();
          f = buildFormation(name, { w, h, n: STAGE_MAX, mobile: small });
          cache.set(key, f);
        }
        return f;
      };

      // The stages to fill, in page order. A stage's index is its slot in the engine.
      const measure = (): Measured[] =>
        [...colonyStore.stages.values()]
          .slice(0, MAX_STAGES)
          .map((s) => ({ id: s.id, formation: s.formation, rect: s.el.getBoundingClientRect() }));
      const plan = (list: Measured[]): StagePlan[] =>
        list.flatMap((s, slot) =>
          visible(s.rect) ? [{ slot, formation: formationFor(s.formation, s.rect.width, s.rect.height) }] : [],
        );

      let stages = measure();
      const need = plan(stages).reduce((n, p) => n + p.formation.used, 0);
      try {
        // Room for every stage, with headroom for them to grow along with the window.
        engine = new ColonyEngine(canvas, { count: Math.max(4096, Math.ceil(need * 1.35)), dpr, calm: false });
      } catch (e) {
        console.warn("[colony] disabled:", e);
        colonyStore.setStatus("unsupported");
        return;
      }
      const eng = engine;
      eng.resize(document.documentElement.clientWidth, canvasHeight(window.innerHeight), dpr);
      const layout = (list: Measured[]) => {
        const counts = eng.setStages(plan(list));
        colonyStore.setCounts(new Map(list.map((s, slot) => [s.id, counts.get(slot) ?? 0])));
      };

      // Resting = reduced motion, or the visitor parked the colony: ants hold still.
      const isCalm = () => reducedQuery.matches || !colonyStore.enabled;
      let calm = isCalm();
      eng.setCalm(calm);
      const syncCalm = () => {
        const next = isCalm();
        if (next !== calm) {
          calm = next;
          eng.setCalm(calm);
        }
      };
      reducedQuery.addEventListener("change", syncCalm);
      const unsubscribe = colonyStore.subscribe(syncCalm);

      const mouse = { x: -9999, y: -9999, on: false };
      const onMove = (e: PointerEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.on = true;
      };
      const onLeave = () => (mouse.on = false);
      const onDown = (e: PointerEvent) => {
        if (e.button === 0 && !calm) eng.kick(e.clientX, e.clientY + window.scrollY, 5);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      off.push(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        reducedQuery.removeEventListener("change", syncCalm);
        unsubscribe();
      });

      // Adaptive quality: if the first seconds run slow, drop resolution, then density.
      const samples: number[] = [];
      let qualityStep = 0;
      const judge = (dt: number) => {
        if (qualityStep > 1) return;
        samples.push(dt);
        if (samples.length < 150) return;
        const sorted = [...samples].sort((a, b) => a - b);
        const median = sorted[sorted.length >> 1];
        samples.length = 0;
        if (median < 0.026) {
          qualityStep = 2;
        } else if (qualityStep === 0 && dpr > 1) {
          dpr = 1;
          eng.resize(document.documentElement.clientWidth, canvasHeight(window.innerHeight), dpr);
          qualityStep = 1;
        } else {
          eng.setDensity(0.5);
          qualityStep = 2;
        }
      };

      // Every stage starts formed, the hero included: the ants appear where they belong.
      layout(stages);
      colonyStore.setStatus("running");

      const sameStages = (a: Measured[], b: Measured[]) =>
        a.length === b.length && a.every((s, i) => s.id === b[i].id && s.formation === b[i].formation);
      const resized = (a: Measured[], b: Measured[]) =>
        a.some((s, i) => Math.abs(s.rect.width - b[i].rect.width) > 2 || Math.abs(s.rect.height - b[i].rect.height) > 2);
      let previous = stages;
      let settling = 0;
      let canvasTop = 0;
      let last = performance.now();

      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = (now - last) / 1000;
        last = now;
        if (document.hidden) return;
        if (dt < 0.25) judge(dt);

        const scrollY = window.scrollY;
        const current = measure();
        if (!sameStages(current, stages)) {
          // Stages came or went: lay everything out again.
          stages = current;
          layout(stages);
        } else if (resized(current, stages)) {
          // A resize: rebuild once the boxes have held still for a moment.
          if (resized(current, previous)) settling = now;
          else if (now - settling > 150) {
            stages = current;
            layout(stages);
          }
        }
        previous = current;

        const vh = window.innerHeight;
        const top = Math.max(0, Math.round(scrollY) - Math.round(vh * OVERSCAN));
        if (top !== canvasTop) {
          canvas.style.transform = `translate3d(0, ${top}px, 0)`;
          canvasTop = top;
        }
        eng.frame({
          dt,
          scrollY,
          top,
          width: document.documentElement.clientWidth,
          height: canvasHeight(vh),
          mouse,
          stages: current.map(({ rect: r }) =>
            visible(r) ? { x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY } : null,
          ),
        });
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      off.forEach((f) => f());
      engine?.dispose();
      colonyStore.setStatus("idle");
    };
  }, []);

  // The parent spans the whole page, so this box does too; it clips the canvas at the page's end.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <canvas ref={canvasRef} className="colony-canvas absolute left-0 top-0" />
    </div>
  );
}
