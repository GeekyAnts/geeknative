"use client";

import { useEffect, useRef, useState } from "react";
import type { ShowcaseApp } from "@/content/showcase";
import { AndroidPhone, ChromeWindow, IPhone, PlatformCaption, Segmented, type Platform } from "./frames";

const BASE = "/geeknative";

const SIZES: Record<Platform, { width: number; height: number; label: string }> = {
  ios: { width: 600, height: 1304, label: "iOS" },
  web: { width: 1600, height: 1000, label: "Web" },
  android: { width: 600, height: 1333, label: "Android" },
};

const shot = (slug: string, platform: Platform, screen: string) => `${BASE}/screens/${slug}/${platform}-${screen}.webp`;
const shotFile = (platform: Platform, screen: string) => `${platform}-${screen}.webp`;

// Every screen of one platform, stacked, so switching is a crossfade.
// A screen with no capture yet keeps the frame's shape and says so, instead of a broken image.
function Layers({ app, platform, screen, shots }: { app: ShowcaseApp; platform: Platform; screen: string; shots: readonly string[] }) {
  const size = SIZES[platform];
  return (
    <>
      {app.screens.map((s, i) => {
        const active = s.id === screen;
        const box = `screen-layer block h-auto w-full ${i === 0 ? "relative" : "absolute inset-0"} ${active ? "opacity-100" : "opacity-0"}`;
        if (!shots.includes(shotFile(platform, s.id))) {
          return (
            <div
              key={s.id}
              aria-hidden={active ? undefined : true}
              style={{ aspectRatio: `${size.width} / ${size.height}` }}
              className={`${box} flex flex-col items-center justify-center bg-[#f5f0e8] px-6 text-center`}
            >
              <p className="text-[15px] font-medium text-[#35251e]">{s.label}</p>
              <p className="mt-2 text-[13px] leading-snug text-[#35251e]/70">Screenshot not captured yet.</p>
            </div>
          );
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.id}
            src={shot(app.slug, platform, s.id)}
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

// The same screen on iOS, web and Android. A control walks the app's screens, and the three stay in sync.
export function AppShowcase({ app, shots }: { app: ShowcaseApp; shots: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const screen = app.screens[index] ?? app.screens[0];

  useEffect(() => {
    const el = root.current;
    if (!auto || !el || app.screens.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry.isIntersecting) timer = window.setInterval(() => setIndex((i) => (i + 1) % app.screens.length), 3400);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [auto, app.screens.length]);

  if (!screen) return null;

  const pick = (id: string) => {
    setAuto(false);
    setIndex(app.screens.findIndex((s) => s.id === id));
  };

  return (
    <div ref={root}>
      <div className="grid grid-cols-2 items-end gap-x-[6%] gap-y-12 md:flex md:justify-center md:gap-x-[3.2%]">
        <div className="md:w-[18.5%]">
          <IPhone>
            <Layers app={app} platform="ios" screen={screen.id} shots={shots} />
          </IPhone>
          <PlatformCaption platform="ios" />
        </div>
        <div className="order-first col-span-2 md:order-none md:w-[56%]">
          <ChromeWindow mode="light" path={screen.path} title={screen.title} favicon={<Mark color={app.mark} />}>
            <Layers app={app} platform="web" screen={screen.id} shots={shots} />
          </ChromeWindow>
          <PlatformCaption platform="web" />
        </div>
        <div className="md:w-[18.5%]">
          <AndroidPhone>
            <Layers app={app} platform="android" screen={screen.id} shots={shots} />
          </AndroidPhone>
          <PlatformCaption platform="android" />
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <Segmented label="Screen" value={screen.id} options={app.screens.map((s): [string, string] => [s.id, s.label])} onChange={pick} />
      </div>
    </div>
  );
}
