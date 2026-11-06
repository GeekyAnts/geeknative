"use client";

import { useEffect, useRef, useState } from "react";
import { AndroidPhone, ChromeWindow, IPhone, PlatformCaption, Segmented, type Mode, type Platform } from "./frames";

type Screen = "home" | "settings";

const BASE = "/geeknative";
const STATES: [Screen, Mode][] = [
  ["home", "light"],
  ["settings", "light"],
  ["settings", "dark"],
  ["home", "dark"],
];

const shot = (p: Platform, s: Screen, m: Mode) => `${BASE}/screens/${p}-${s}-${m}.webp`;

// Every state of one platform's screen, stacked, so switching is a crossfade.
function Layers({ platform, screen, mode, width, height }: { platform: Platform; screen: Screen; mode: Mode; width: number; height: number }) {
  return (
    <>
      {STATES.map(([s, m], i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${s}-${m}`}
          src={shot(platform, s, m)}
          alt={i === 0 ? `${platform === "ios" ? "iOS" : platform === "android" ? "Android" : "Web"} app, ${s} screen` : ""}
          aria-hidden={s === screen && m === mode ? undefined : true}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={`screen-layer block h-auto w-full ${i === 0 ? "relative" : "absolute inset-0"} ${s === screen && m === mode ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </>
  );
}

// Real screenshots of the starter app, in an iPhone, a Chrome window and an Android phone.
// The three switch together: same screen, same appearance, three native builds.
export function DeviceShowcase({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [state, setState] = useState(0);
  const [auto, setAuto] = useState(!compact);
  const [screen, mode] = STATES[state];
  const root = useRef<HTMLDivElement>(null);

  // Cycle through the states while the showcase is on screen, until someone picks one.
  useEffect(() => {
    const el = root.current;
    if (!auto || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => setState((s) => (s + 1) % STATES.length), 3400);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [auto]);

  const pick = (nextScreen: Screen, nextMode: Mode) => {
    setAuto(false);
    setState(STATES.findIndex(([s, m]) => s === nextScreen && m === nextMode));
  };

  const path = screen === "settings" ? "/settings" : "/";
  const title = screen === "settings" ? "Settings · My App" : "My App";

  return (
    <div ref={root} className={className}>
      <div className="grid grid-cols-2 items-end gap-x-[6%] gap-y-12 md:flex md:justify-center md:gap-x-[3.2%]">
        <div className="md:w-[18.5%]">
          <IPhone>
            <Layers platform="ios" screen={screen} mode={mode} width={600} height={1304} />
          </IPhone>
          {compact ? null : <PlatformCaption platform="ios" />}
        </div>
        <div className="order-first col-span-2 md:order-none md:w-[56%]">
          <ChromeWindow mode={mode} path={path} title={title}>
            <Layers platform="web" screen={screen} mode={mode} width={1600} height={1000} />
          </ChromeWindow>
          {compact ? null : <PlatformCaption platform="web" />}
        </div>
        <div className="md:w-[18.5%]">
          <AndroidPhone>
            <Layers platform="android" screen={screen} mode={mode} width={600} height={1333} />
          </AndroidPhone>
          {compact ? null : <PlatformCaption platform="android" />}
        </div>
      </div>

      <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? "mt-8" : "mt-12"}`}>
        <Segmented
          label="Screen"
          value={screen}
          options={[
            ["home", "Home"],
            ["settings", "Settings"],
          ]}
          onChange={(s) => pick(s, mode)}
        />
        <Segmented
          label="Appearance"
          value={mode}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
          onChange={(m) => pick(screen, m)}
        />
      </div>
    </div>
  );
}
