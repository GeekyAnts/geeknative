"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type Mode = "light" | "dark";
export type Platform = "ios" | "android" | "web";

export function IPhone({ children }: { children: ReactNode }) {
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

export function AndroidPhone({ children }: { children: ReactNode }) {
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
function StarterFavicon() {
  return (
    <svg viewBox="0 0 64 64" className="size-[14px] shrink-0" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#4F46E5" />
      <circle cx="19" cy="32" r="5.5" fill="#fff" />
      <circle cx="32" cy="32" r="5.5" fill="#fff" />
      <circle cx="45" cy="32" r="5.5" fill="#fff" />
    </svg>
  );
}

export function ChromeWindow({
  mode,
  path,
  title,
  favicon,
  children,
}: {
  mode: Mode;
  path: string;
  title: string;
  favicon?: ReactNode;
  children: ReactNode;
}) {
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
          {favicon ?? <StarterFavicon />}
          <span className="min-w-0 flex-1 truncate">{title}</span>
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

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 6l5 5 5-5" strokeLinecap="square" />
    </svg>
  );
}

// Small screens can't fit a project's screens in one row. This holds the whole list in a panel.
export function ScreenMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const index = Math.max(0, options.findIndex(([id]) => id === value));
  const current = options[index]?.[1] ?? "";

  const place = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const needed = Math.min(window.innerHeight * 0.5, 352, options.length * 46 + 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setAbove(spaceBelow < needed && spaceAbove > spaceBelow);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>("[aria-selected='true']")?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  const move = (delta: number) => {
    const next = options[(index + delta + options.length) % options.length];
    if (next) onChange(next[0]);
  };

  return (
    <div ref={root} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!open) place();
          setOpen((isOpen) => !isOpen);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) {
              place();
              setOpen(true);
            } else move(1);
          } else if (event.key === "ArrowUp" && open) {
            event.preventDefault();
            move(-1);
          } else if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className="flex h-12 w-full items-center gap-3 rounded-full bg-white pl-4 pr-1.5 text-left ring-1 ring-inset ring-line-strong"
      >
        <span className="label shrink-0 text-muted">{label}</span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.01em]">{current}</span>
        <span className="label shrink-0 tabular-nums text-faint">
          {String(index + 1).padStart(2, "0")} / {String(options.length).padStart(2, "0")}
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white">
          <Chevron open={open} />
        </span>
      </button>
      {open ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className={`absolute left-0 right-0 z-30 max-h-[min(22rem,50vh)] overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_18px_50px_-20px_rgb(11_11_11/0.4)] ring-1 ring-line [scrollbar-width:thin] ${above ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {options.map(([id, text], i) => {
            const selected = id === value;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${selected ? "bg-ink text-white" : "text-ink hover:bg-mist"}`}
              >
                <span className={`label w-7 shrink-0 tabular-nums ${selected ? "text-white/70" : "text-faint"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px]">{text}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// Pills from md up, where a row has room. Below that, every screen lives in the menu.
export function ShowcaseControls({
  screens,
  screen,
  mode,
  onScreen,
  onMode,
  className = "",
}: {
  screens: [string, string][];
  screen: string;
  mode: Mode;
  onScreen: (id: string) => void;
  onMode: (mode: Mode) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:justify-center ${className}`}>
      <div className="md:hidden">
        <ScreenMenu label="Screen" value={screen} options={screens} onChange={onScreen} />
      </div>
      <div className="hidden md:block">
        <Segmented label="Screen" value={screen} options={screens} onChange={onScreen} />
      </div>
      <div className="flex justify-center">
        <Segmented<Mode>
          label="Appearance"
          value={mode}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
          onChange={onMode}
        />
      </div>
    </div>
  );
}

const CAPTIONS: Record<Platform, [string, string]> = {
  ios: ["iOS 26", "SwiftUI"],
  web: ["Chrome", "TanStack Start"],
  android: ["Android 15", "Jetpack Compose"],
};

export function PlatformCaption({ platform, className = "" }: { platform: Platform; className?: string }) {
  return (
    <p className={`label mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-muted ${className}`}>
      <span className="text-ink">{CAPTIONS[platform][0]}</span>
      <span className="text-faint">/</span>
      <span>{CAPTIONS[platform][1]}</span>
    </p>
  );
}

// Android captures are 1333px tall against the iPhone's 1304, and the bezel is thinner,
// so the same column width makes that frame taller. 97% width brings the outer heights together.
const androidFrame = "mx-auto w-[97%] md:mx-0 md:w-full";

// Web on top at small sizes, then the two phones on one line. From md up, the three sit in a row.
export function DeviceStage({
  ios,
  web,
  android,
  captions = true,
}: {
  ios: ReactNode;
  web: ReactNode;
  android: ReactNode;
  captions?: boolean;
}) {
  return (
    <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-center md:gap-x-[3.2%]">
      <div className="min-w-0 md:order-2 md:w-[56%]">
        {web}
        {captions ? <PlatformCaption platform="web" /> : null}
      </div>
      <div className="grid grid-cols-2 items-start gap-x-[6%] md:contents">
        <div className="min-w-0 md:order-1 md:w-[18.5%]">
          {ios}
          {captions ? (
            <div className="hidden md:block">
              <PlatformCaption platform="ios" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 md:order-3 md:w-[18.5%]">
          <div className={androidFrame}>{android}</div>
          {captions ? (
            <div className="hidden md:block">
              <PlatformCaption platform="android" />
            </div>
          ) : null}
        </div>
        {captions ? <PlatformCaption platform="ios" className="md:hidden" /> : null}
        {captions ? <PlatformCaption platform="android" className="md:hidden" /> : null}
      </div>
    </div>
  );
}
