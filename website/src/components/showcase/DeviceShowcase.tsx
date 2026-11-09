"use client";

import { useEffect, useRef, useState } from "react";
import { deviceShowcaseCatalog, type DeviceShowcaseApp } from "@/lib/showcase-catalog";
import { AndroidPhone, ChromeWindow, IPhone, PlatformCaption, Segmented, type Mode, type Platform } from "./frames";

const APPS = deviceShowcaseCatalog.apps;

const SIZES: Record<Platform, { width: number; height: number; label: string }> = {
  ios: { width: 600, height: 1304, label: "iOS" },
  web: { width: 1600, height: 1000, label: "Web" },
  android: { width: 600, height: 1333, label: "Android" },
};

const MODES: Mode[] = ["light", "dark"];

const shot = (app: DeviceShowcaseApp, platform: Platform, screen: string, mode: Mode) =>
  `${app.shotPrefix}/${platform}-${screen}-${mode}.webp`;

function Layers({ app, platform, screen, mode }: { app: DeviceShowcaseApp; platform: Platform; screen: string; mode: Mode }) {
  const size = SIZES[platform];
  const frames = app.screens.flatMap((s) => MODES.map((m) => ({ s, m })));
  return (
    <>
      {frames.map(({ s, m }) => {
        const active = s.id === screen && m === mode;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${s.id}-${m}`}
            src={shot(app, platform, s.id, m)}
            alt={active ? `${size.label} app, ${s.label} screen` : ""}
            aria-hidden={active ? undefined : true}
            width={size.width}
            height={size.height}
            loading="lazy"
            decoding="async"
            className={`screen-layer block h-auto w-full ${active ? "relative opacity-100" : "absolute inset-0 opacity-0"}`}
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

function cycle(screens: DeviceShowcaseApp["screens"]) {
  return MODES.flatMap((mode) => screens.map((screen) => ({ id: screen.id, mode })));
}

export function DeviceShowcase({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const first = APPS[0];
  const [appSlug, setAppSlug] = useState(first?.slug ?? "");
  const [cursor, setCursor] = useState(0);
  const [auto, setAuto] = useState(!compact);
  const root = useRef<HTMLDivElement>(null);

  const app = APPS.find((item) => item.slug === appSlug) ?? first;
  const frames = app ? cycle(app.screens) : [];
  const frame = frames[cursor] ?? frames[0];
  const screen = app?.screens.find((item) => item.id === frame?.id) ?? app?.screens[0];
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

  if (!app || !screen) return null;

  const pickApp = (slug: string) => {
    const next = APPS.find((item) => item.slug === slug);
    if (!next) return;
    const nextFrames = cycle(next.screens);
    const index = nextFrames.findIndex((item) => item.id === next.screens[0]?.id && item.mode === mode);
    setAuto(false);
    setAppSlug(slug);
    setCursor(index < 0 ? 0 : index);
  };

  const pickScreen = (id: string) => {
    const index = frames.findIndex((item) => item.id === id && item.mode === mode);
    if (index < 0) return;
    setAuto(false);
    setCursor(index);
  };

  const pickMode = (next: Mode) => {
    const index = frames.findIndex((item) => item.id === screen.id && item.mode === next);
    if (index < 0) return;
    setAuto(false);
    setCursor(index);
  };

  return (
    <div ref={root} className={className}>
      <div className="grid grid-cols-2 items-end gap-x-[6%] gap-y-12 md:flex md:justify-center md:gap-x-[3.2%]">
        <div className="md:w-[18.5%]">
          <IPhone>
            <Layers key={app.slug} app={app} platform="ios" screen={screen.id} mode={mode} />
          </IPhone>
          {compact ? null : <PlatformCaption platform="ios" />}
        </div>
        <div className="order-first col-span-2 md:order-none md:w-[56%]">
          <ChromeWindow
            mode={mode}
            path={screen.webPath}
            title={screen.title}
            favicon={app.slug === "starter" ? undefined : <Mark color={app.mark} />}
          >
            <Layers key={app.slug} app={app} platform="web" screen={screen.id} mode={mode} />
          </ChromeWindow>
          {compact ? null : <PlatformCaption platform="web" />}
        </div>
        <div className="md:w-[18.5%]">
          <AndroidPhone>
            <Layers key={app.slug} app={app} platform="android" screen={screen.id} mode={mode} />
          </AndroidPhone>
          {compact ? null : <PlatformCaption platform="android" />}
        </div>
      </div>

      <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? "mt-8" : "mt-12"}`}>
        {APPS.length > 1 ? (
          <Segmented
            label="App"
            value={app.slug}
            options={APPS.map((item): [string, string] => [item.slug, item.name])}
            onChange={pickApp}
          />
        ) : null}
        <Segmented
          label="Screen"
          value={screen.id}
          options={app.screens.map((item): [string, string] => [item.id, item.label])}
          onChange={pickScreen}
        />
        <Segmented
          label="Appearance"
          value={mode}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
          onChange={pickMode}
        />
      </div>
    </div>
  );
}
