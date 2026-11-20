"use client";

import { useEffect, useRef, useState } from "react";
import { TextLink } from "@/components/ui/primitives";
import { deviceShowcaseCatalog, type DeviceShowcaseApp } from "@/lib/showcase-catalog";
import { AndroidPhone, ChromeWindow, DeviceStage, IPhone, Segmented, type Mode, type Platform } from "./frames";

const STARTER = deviceShowcaseCatalog.apps[0];

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

function cycle(screens: DeviceShowcaseApp["screens"]) {
  return MODES.flatMap((mode) => screens.map((screen) => ({ id: screen.id, mode })));
}

export function DeviceShowcase({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [cursor, setCursor] = useState(0);
  const [auto, setAuto] = useState(!compact);
  const root = useRef<HTMLDivElement>(null);

  const app = STARTER;
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
      <DeviceStage
        captions={!compact}
        ios={
          <IPhone>
            <Layers key={app.slug} app={app} platform="ios" screen={screen.id} mode={mode} />
          </IPhone>
        }
        web={
          <ChromeWindow mode={mode} path={screen.webPath} title={screen.title}>
            <Layers key={app.slug} app={app} platform="web" screen={screen.id} mode={mode} />
          </ChromeWindow>
        }
        android={
          <AndroidPhone>
            <Layers key={app.slug} app={app} platform="android" screen={screen.id} mode={mode} />
          </AndroidPhone>
        }
      />

      <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? "mt-8" : "mt-12"}`}>
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
      {compact ? null : (
        <p className="mt-7 text-center text-base text-ink/70">
          See other demo apps created using GeekNative in the{" "}
          <TextLink href="/geeknative/showcase/" className="text-base text-brand">
            Showcase
          </TextLink>
        </p>
      )}
    </div>
  );
}
