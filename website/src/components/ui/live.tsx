"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { colonyStore } from "@/lib/colony/store";

// Counts up to `value` the first time it scrolls into view.
export function CountUp({ value, suffix = "", duration = 1800 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          setN(Math.round(value * (1 - Math.pow(1 - p, 4))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

// Local time in an office, refreshed every 20 seconds.
export function OfficeClock({ tz }: { tz: string }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [tz]);
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

function useColony<T extends string | number | boolean>(select: (colony: typeof colonyStore) => T, server: T) {
  return useSyncExternalStore(colonyStore.subscribe, () => select(colonyStore), () => server);
}

// How many ants are drawing one stage.
export function ColonyCount({ stage, fallback }: { stage: string; fallback: string }) {
  const n = useColony((c) => (c.status === "running" ? (c.counts.get(stage) ?? 0) : 0), 0);
  return <>{n > 0 ? n.toLocaleString("en-US") : fallback}</>;
}

// Lets visitors park the colony. Remembered per browser.
export function ColonyToggle({ className = "" }: { className?: string }) {
  const unsupported = useColony((c) => c.status === "unsupported", false);
  const on = useColony((c) => c.enabled, true);
  if (unsupported) return null;
  return (
    <button
      type="button"
      onClick={() => colonyStore.setEnabled(!on)}
      aria-pressed={on}
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <span className={`relative block h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-brand" : "bg-line-strong"}`}>
        <span className={`absolute left-0.5 top-0.5 block size-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${on ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      <span className="label">{on ? "Colony on" : "Colony resting"}</span>
    </button>
  );
}

// The invitation to play only makes sense while the ants are awake.
export function ColonyHint({ children }: { children: ReactNode }) {
  const awake = useColony((c) => c.status === "running" && c.enabled, false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  if (!awake || reduced) return null;
  return <>{children}</>;
}
