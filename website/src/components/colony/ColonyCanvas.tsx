"use client";

import { useEffect, useRef } from "react";
import type { ColonyEngine } from "@/lib/colony/engine";
import type { Formation, FormationName } from "@/lib/colony/formations";
import { colonyStore } from "@/lib/colony/store";

// Owns the fixed canvas and decides, every frame, which stage the colony is
// working on: the registered stage that best fills the middle of the viewport.
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
      const [{ ColonyEngine, supportsColony }, { buildFormation }] = await Promise.all([
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
      const side = small ? 56 : 80;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      try {
        engine = new ColonyEngine(canvas, { sx: side, sy: side, dpr, calm: false });
      } catch (e) {
        console.warn("[colony] disabled:", e);
        colonyStore.setStatus("unsupported");
        return;
      }
      const eng = engine;
      eng.resize(document.documentElement.clientWidth, window.innerHeight, dpr);

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

      const cache = new Map<string, Formation>();
      const formationFor = (name: FormationName, w: number, h: number) => {
        const key = `${name}|${Math.round(w)}x${Math.round(h)}`;
        let f = cache.get(key);
        if (!f) {
          f = buildFormation(name, { w, h, n: eng.count, mobile: small });
          cache.set(key, f);
        }
        return f;
      };

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

      let active: { id: string; formation: FormationName; w: number; h: number } | null = null;
      let spawned = false;
      let last = performance.now();

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
          eng.resize(document.documentElement.clientWidth, window.innerHeight, dpr);
          qualityStep = 1;
        } else {
          eng.setDensity(0.5);
          qualityStep = 2;
        }
      };

      const pickStage = (vh: number) => {
        const bandTop = vh * 0.18;
        const bandBot = vh * 0.82;
        let best: { id: string; rect: DOMRect; formation: FormationName } | null = null;
        let bestScore = 0;
        for (const s of colonyStore.stages.values()) {
          const r = s.el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          const overlap = Math.min(r.bottom, bandBot) - Math.max(r.top, bandTop);
          if (overlap <= 0) continue;
          let score = overlap / Math.min(r.height, bandBot - bandTop);
          if (active?.id === s.id) score += 0.2;
          if (score > bestScore) {
            bestScore = score;
            best = { id: s.id, rect: r, formation: s.formation };
          }
        }
        if (!best && active) {
          const s = colonyStore.stages.get(active.id);
          if (s) best = { id: s.id, rect: s.el.getBoundingClientRect(), formation: s.formation };
        }
        return best;
      };

      colonyStore.setStatus("running", eng.count);

      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = (now - last) / 1000;
        last = now;
        if (document.hidden) return;
        if (spawned && dt < 0.25) judge(dt);

        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        const scrollY = window.scrollY;
        const stage = pickStage(vh);
        if (stage) {
          const { rect } = stage;
          const changed =
            !active ||
            active.id !== stage.id ||
            active.formation !== stage.formation ||
            Math.abs(active.w - rect.width) > 2 ||
            Math.abs(active.h - rect.height) > 2;
          if (changed) {
            const f = formationFor(stage.formation, rect.width, rect.height);
            if (!spawned) {
              spawned = true;
              const logo = document.querySelector<HTMLElement>("[data-colony-spawn]")?.getBoundingClientRect();
              if (!calm && logo && scrollY < vh) {
                eng.spawnAt(logo.left + logo.width / 2, logo.top + logo.height / 2 + scrollY, 6);
                eng.setFormation(f);
                // March along the top of the page, then pour into the stage from above.
                eng.intro(rect.left + rect.width * 0.55, logo.top + logo.height / 2 + scrollY, rect.left - 24);
              } else {
                eng.setFormation(f, true);
              }
            } else {
              eng.setFormation(f, calm);
            }
            active = { id: stage.id, formation: stage.formation, w: rect.width, h: rect.height };
          }
        }
        const rect = stage?.rect;
        eng.frame({
          dt,
          scrollY,
          width: vw,
          height: vh,
          mouse,
          stage: rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + scrollY } : null,
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

  return <canvas ref={canvasRef} aria-hidden className="colony-canvas pointer-events-none fixed left-0 top-0 z-40" />;
}
