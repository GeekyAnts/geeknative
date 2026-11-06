"use client";

import { useEffect, useRef, useState } from "react";
import type { ShowcaseApp } from "@/content/showcase";
import { AndroidPhone, ChromeWindow, IPhone, PlatformCaption, Segmented, type Mode, type Platform } from "./frames";

const BASE = "/geeknative";

const SIZES: Record<Platform, { width: number; height: number; label: string }> = {
  ios: { width: 600, height: 1304, label: "iOS" },
  web: { width: 1600, height: 1000, label: "Web" },
  android: { width: 600, height: 1333, label: "Android" },
};

const MODES: Mode[] = ["light", "dark"];

const shot = (slug: string, platform: Platform, screen: string, mode: Mode) =>
  `${BASE}/screens/${slug}/${platform}-${screen}-${mode}.webp`;
const shotFile = (platform: Platform, screen: string, mode: Mode) => `${platform}-${screen}-${mode}.webp`;

// Every screen and appearance of one platform, stacked, so switching is a crossfade.
// A capture that is not on disk yet keeps the frame's shape and says so, instead of a broken image.
function Layers({
  app,
  platform,
  screen,
  mode,
  shots,
}: {
  app: ShowcaseApp;
  platform: Platform;
  screen: string;
  mode: Mode;
  shots: readonly string[];
}) {
  const size = SIZES[platform];
  const frames = app.screens.flatMap((s) => MODES.map((m) => ({ s, m })));
  return (
    <>
      {frames.map(({ s, m }, i) => {
        const active = s.id === screen && m === mode;
        // The visible capture stays in flow. The others sit on top of it and fade.
        const box = `screen-layer block h-auto w-full ${active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`;
        if (!shots.includes(shotFile(platform, s.id, m))) {
          const dark = m === "dark";
          return (
            <div
              key={`${s.id}-${m}`}
              aria-hidden={active ? undefined : true}
              style={{ aspectRatio: `${size.width} / ${size.height}` }}
              className={`${box} flex flex-col items-center justify-center px-6 text-center ${dark ? "bg-[#1c1917] text-[#f5f0e8]" : "bg-[#f5f0e8] text-[#35251e]"}`}
            >
              <p className="text-[15px] font-medium">{s.label}</p>
              <p className={`mt-2 text-[13px] leading-snug ${dark ? "text-[#f5f0e8]/70" : "text-[#35251e]/70"}`}>Screenshot not captured yet.</p>
            </div>
          );
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${s.id}-${m}`}
            src={shot(app.slug, platform, s.id, m)}
            alt={i === 0 ? `${size.label}, ${s.label}` : ""}
            aria-hidden={active ? undefined : true}
            width={size.width}
            height={size.height}
            loading="lazy"
            decoding="async"
            className={box}
          />
        );
      })}
    </>
  );
}

function Mark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" className="size-[14px] shrink-0" aria-hidden>
      <rect width="64" height="64" rx="14" fill={color} />
    </svg>
  );
}

// Light passes of every screen, then the same screens in dark. The auto cycle walks this in order.
function cycle(screens: ShowcaseApp["screens"]) {
  return (["light", "dark"] as const).flatMap((mode) => screens.map((_, index) => ({ index, mode })));
}

// The same screen on iOS, web and Android. A control walks the app's screens, and the three stay in sync.
export function AppShowcase({ app, shots }: { app: ShowcaseApp; shots: readonly string[] }) {
  const frames = cycle(app.screens);
  const [cursor, setCursor] = useState(0);
  const [auto, setAuto] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const frame = frames[cursor] ?? frames[0];
  const screen = frame ? app.screens[frame.index] : undefined;
  const mode = frame?.mode ?? "light";

  useEffect(() => {
    const el = root.current;
    if (!auto || !el || frames.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry.isIntersecting) timer = window.setInterval(() => setCursor((current) => (current + 1) % frames.length), 3400);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [auto, frames.length]);

  if (!screen) return null;

  const show = (index: number, nextMode: Mode) => {
    const next = frames.findIndex((item) => item.index === index && item.mode === nextMode);
    if (next < 0) return;
    setAuto(false);
    setCursor(next);
  };

  return (
    <div ref={root}>
      <div className="grid grid-cols-2 items-end gap-x-[6%] gap-y-12 md:flex md:justify-center md:gap-x-[3.2%]">
        <div className="md:w-[18.5%]">
          <IPhone>
            <Layers app={app} platform="ios" screen={screen.id} mode={mode} shots={shots} />
          </IPhone>
          <PlatformCaption platform="ios" />
        </div>
        <div className="order-first col-span-2 md:order-none md:w-[56%]">
          <ChromeWindow mode={mode} path={screen.path} title={screen.title} favicon={<Mark color={app.mark} />}>
            <Layers app={app} platform="web" screen={screen.id} mode={mode} shots={shots} />
          </ChromeWindow>
          <PlatformCaption platform="web" />
        </div>
        <div className="md:w-[18.5%]">
          <AndroidPhone>
            <Layers app={app} platform="android" screen={screen.id} mode={mode} shots={shots} />
          </AndroidPhone>
          <PlatformCaption platform="android" />
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <Segmented
          label="Screen"
          value={screen.id}
          options={app.screens.map((s): [string, string] => [s.id, s.label])}
          onChange={(id) => show(app.screens.findIndex((s) => s.id === id), mode)}
        />
        <Segmented
          label="Appearance"
          value={mode}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
          onChange={(next) => show(frame.index, next)}
        />
      </div>
    </div>
  );
}
