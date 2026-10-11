"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BRAND_RED } from "@/lib/brand";
import {
  devicesGeometry,
  flowGeometry,
  parityGrid,
  PARITY_COLS,
  PARITY_ROWS,
  screenOf,
  type DeviceRect,
} from "@/lib/colony/formations";

// Measures the stage box an overlay sits on, so labels align with the colony's geometry.
function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

function Overlay({ children, className = "" }: { children: (box: { w: number; h: number }) => ReactNode; className?: string }) {
  const [ref, box] = useBox();
  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {box ? children(box) : null}
    </div>
  );
}

const DEVICE_LABELS: Record<DeviceRect["kind"], [string, string]> = {
  ios: ["iOS", "SwiftUI"],
  web: ["Web", "TanStack Start"],
  android: ["Android", "Jetpack Compose"],
};

// Captions under each device the ants draw in the hero.
export function DeviceLabels() {
  return (
    <Overlay>
      {({ w, h }) =>
        devicesGeometry(w, h).map((d) => (
          <div
            key={d.kind}
            className="figure-label label absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-muted"
            style={{ left: d.x + d.w / 2, top: d.y + d.h + 14 }}
          >
            <span className="text-ink">{DEVICE_LABELS[d.kind][0]}</span>
            {/* Phones sit close together on small screens: name the platform only. */}
            {w >= 520 || d.kind === "web" ? (
              <>
                <span className="text-faint">/</span>
                <span>{DEVICE_LABELS[d.kind][1]}</span>
              </>
            ) : null}
          </div>
        ))
      }
    </Overlay>
  );
}

// A static drawing of the same devices, shown when the colony isn't running.
export function DevicesFallback() {
  return (
    <Overlay>
      {({ w, h }) => (
        <svg width={w} height={h} className="absolute inset-0">
          {devicesGeometry(w, h).map((d) => {
            const s = screenOf(d);
            return (
              <g key={d.kind} fill="none" stroke="currentColor" className="text-ink/70">
                <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.r} strokeWidth={1.5} />
                <rect x={s.x + s.w * 0.08} y={s.y + s.h * 0.12} width={s.w * 0.5} height={s.h * 0.045} rx={4} fill={BRAND_RED} stroke="none" />
                <rect x={s.x + s.w * 0.08} y={s.y + s.h * 0.22} width={s.w * 0.84} height={s.h * 0.2} rx={10} fill={BRAND_RED} stroke="none" opacity={0.85} />
              </g>
            );
          })}
        </svg>
      )}
    </Overlay>
  );
}

const STATIONS = [
  { key: "prompt", title: "You", note: "A plain prompt" },
  { key: "agents", title: "AGENTS.md", note: "Triage" },
  { key: "truth", title: "Spec + contracts", note: "Source of truth" },
  { key: "ios", title: "iOS", note: "SwiftUI" },
  { key: "android", title: "Android", note: "Jetpack Compose" },
  { key: "web", title: "Web", note: "TanStack Start" },
  { key: "check", title: "make check", note: "Tests and parity" },
] as const;

// Station names for the flow the ants draw in "How it works".
export function FlowLabels() {
  return (
    <Overlay>
      {({ w, h }) => {
        const g = flowGeometry(w, h);
        const points = { prompt: g.prompt, agents: g.agents, truth: g.truth, ios: g.apps[0], android: g.apps[1], web: g.apps[2], check: g.check };
        return STATIONS.map((s) => {
          const [x, y] = points[s.key];
          const isApp = s.key === "ios" || s.key === "android" || s.key === "web";
          const r = isApp ? g.r * 1.3 : g.r;
          const style = g.vertical
            ? { left: isApp ? x : x + r + 14, top: isApp ? y + r + 10 : y, transform: isApp ? "translateX(-50%)" : "translateY(-50%)" }
            : { left: x, top: y + r + 12, transform: "translateX(-50%)" };
          return (
            <div key={s.key} className={`figure-label absolute whitespace-nowrap ${g.vertical && !isApp ? "text-left" : "text-center"}`} style={style}>
              <p className="text-[13.5px] font-[650] tracking-[-0.01em] wide">{s.title}</p>
              <p className="label mt-1 text-muted">{s.note}</p>
            </div>
          );
        });
      }}
    </Overlay>
  );
}

// The parity table: row and column labels, plus the empty cells for untested criteria.
export function ParityCells() {
  return (
    <Overlay>
      {({ w, h }) => {
        const mobile = w < 560;
        const { label, colW, rowH, cells } = parityGrid(w, h, mobile);
        return (
          <>
            {PARITY_COLS.map((c, i) => (
              <span key={c} className="label absolute -translate-x-1/2 text-muted" style={{ left: label + colW * (i + 0.5), top: -26 }}>
                {c}
              </span>
            ))}
            {PARITY_ROWS.map((r, i) => (
              <span key={r} className="label absolute -translate-y-1/2 tabular-nums text-ink/80" style={{ left: 0, top: rowH * (i + 0.5) }}>
                {r}
              </span>
            ))}
            {cells.map((c) =>
              c.tested ? (
                <span
                  key={`${c.r}-${c.c}`}
                  className="colony-fallback absolute rounded-[5px] bg-brand"
                  style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
                />
              ) : (
                <span
                  key={`${c.r}-${c.c}`}
                  className="absolute flex items-center justify-center rounded-[5px] border border-dashed border-line-strong"
                  style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
                >
                  <span className="label text-faint">not tested</span>
                </span>
              ),
            )}
          </>
        );
      }}
    </Overlay>
  );
}
