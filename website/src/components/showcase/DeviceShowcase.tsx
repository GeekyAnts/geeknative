"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Screen = "home" | "settings";
type Mode = "light" | "dark";
type Platform = "ios" | "android" | "web";

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

function IPhone({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute -left-[1.7%] top-[16.5%] h-[3%] w-[1.7%] rounded-l-[3px] bg-[#38383c]" />
      <span className="absolute -left-[1.7%] top-[22.5%] h-[6.2%] w-[1.7%] rounded-l-[3px] bg-[#38383c]" />
      <span className="absolute -left-[1.7%] top-[30%] h-[6.2%] w-[1.7%] rounded-l-[3px] bg-[#38383c]" />
      <span className="absolute -right-[1.7%] top-[25.5%] h-[9.5%] w-[1.7%] rounded-r-[3px] bg-[#38383c]" />
      <div className="device-shadow rounded-[16%/7.4%] bg-[linear-gradient(150deg,#5b5b60_0%,#1d1d20_38%,#2c2c30_72%,#505055_100%)] p-[1.1%]">
        <div className="rounded-[15%/6.95%] bg-[#060607] p-[3.3%]">
          <div className="relative isolate overflow-hidden rounded-[12%/5.5%] bg-black">
            {children}
            <span className="absolute left-1/2 top-[1.3%] h-[4.1%] w-[31%] -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AndroidPhone({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute -right-[1.6%] top-[18%] h-[7.5%] w-[1.6%] rounded-r-[3px] bg-[#2f3034]" />
      <span className="absolute -right-[1.6%] top-[28.5%] h-[12%] w-[1.6%] rounded-r-[3px] bg-[#2f3034]" />
      <div className="device-shadow rounded-[12%/5.4%] bg-[linear-gradient(160deg,#47484d_0%,#151517_42%,#2a2b2f_100%)] p-[1%]">
        <div className="rounded-[11%/4.95%] bg-[#070708] p-[2.7%]">
          <div className="relative isolate overflow-hidden rounded-[8%/3.6%] bg-black">
            {children}
            <span className="absolute left-1/2 top-[1.25%] aspect-square w-[4.4%] -translate-x-1/2 rounded-full bg-[#050505] ring-[1.5px] ring-[#202024]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// The starter app's own favicon, shown in the browser tab.
function AppFavicon() {
  return (
    <svg viewBox="0 0 64 64" className="size-[14px] shrink-0" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#4F46E5" />
      <circle cx="19" cy="32" r="5.5" fill="#fff" />
      <circle cx="32" cy="32" r="5.5" fill="#fff" />
      <circle cx="45" cy="32" r="5.5" fill="#fff" />
    </svg>
  );
}

function ChromeWindow({ mode, path, children }: { mode: Mode; path: string; children: ReactNode }) {
  const dark = mode === "dark";
  return (
    <div
      className={`device-shadow overflow-hidden rounded-[11px] ring-1 transition-colors duration-500 ${
        dark ? "bg-[#202124] ring-white/10" : "bg-[#dfe3e8] ring-black/10"
      }`}
    >
      <div className="flex h-[36px] items-end gap-2 pl-3 pr-2">
        <div className="flex items-center gap-[7px] self-center pr-3">
          <span className="size-[11px] rounded-full bg-[#ff5f57]" />
          <span className="size-[11px] rounded-full bg-[#febc2e]" />
          <span className="size-[11px] rounded-full bg-[#28c840]" />
        </div>
        <div
          className={`flex h-[28px] w-[min(220px,45%)] items-center gap-2 rounded-t-[9px] px-3 text-[12px] transition-colors duration-500 ${
            dark ? "bg-[#35363a] text-white/90" : "bg-white text-[#3c4043]"
          }`}
        >
          <AppFavicon />
          <span className="min-w-0 flex-1 truncate">{path === "/settings" ? "Settings · My App" : "My App"}</span>
          <span className="text-[13px] leading-none opacity-50">×</span>
        </div>
        <span className={`mb-[7px] ml-1 text-[17px] leading-none ${dark ? "text-white/60" : "text-[#5f6368]"}`}>+</span>
      </div>
      <div className={`flex h-[38px] items-center gap-3 px-3 transition-colors duration-500 ${dark ? "bg-[#35363a] text-white/70" : "bg-white text-[#5f6368]"}`}>
        <svg viewBox="0 0 24 24" className="size-[15px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg viewBox="0 0 24 24" className="size-[15px] shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg viewBox="0 0 24 24" className="size-[15px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div
          className={`flex h-[28px] min-w-0 flex-1 items-center gap-2 rounded-full px-3.5 text-[12.5px] transition-colors duration-500 ${
            dark ? "bg-[#202124] text-white/85" : "bg-[#f1f3f4] text-[#202124]"
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-[12px] shrink-0 opacity-70" fill="currentColor" aria-hidden>
            <path d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z" />
          </svg>
          <span className="truncate">
            localhost:3000<span className="opacity-60">{path}</span>
          </span>
        </div>
      </div>
      <div className="relative isolate">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-white p-1 ring-1 ring-inset ring-line-strong">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`label rounded-full px-4 py-2 transition-colors duration-300 ${value === v ? "bg-ink text-white" : "text-ink/65 hover:text-ink"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

const CAPTIONS: Record<Platform, [string, string]> = {
  ios: ["iOS 26", "SwiftUI"],
  web: ["Chrome", "TanStack Start"],
  android: ["Android 15", "Jetpack Compose"],
};

function Caption({ platform }: { platform: Platform }) {
  return (
    <p className="label mt-5 flex items-center justify-center gap-2 text-muted">
      <span className="text-ink">{CAPTIONS[platform][0]}</span>
      <span className="text-faint">/</span>
      <span>{CAPTIONS[platform][1]}</span>
    </p>
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

  return (
    <div ref={root} className={className}>
      <div className="grid grid-cols-2 items-end gap-x-[6%] gap-y-12 md:flex md:justify-center md:gap-x-[3.2%]">
        <div className="md:w-[18.5%]">
          <IPhone>
            <Layers platform="ios" screen={screen} mode={mode} width={600} height={1304} />
          </IPhone>
          {compact ? null : <Caption platform="ios" />}
        </div>
        <div className="order-first col-span-2 md:order-none md:w-[56%]">
          <ChromeWindow mode={mode} path={path}>
            <Layers platform="web" screen={screen} mode={mode} width={1600} height={1000} />
          </ChromeWindow>
          {compact ? null : <Caption platform="web" />}
        </div>
        <div className="md:w-[18.5%]">
          <AndroidPhone>
            <Layers platform="android" screen={screen} mode={mode} width={600} height={1333} />
          </AndroidPhone>
          {compact ? null : <Caption platform="android" />}
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
