"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Arrow, Button, wrap } from "@/components/ui/primitives";
import { links, nav } from "@/content/site";

export function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// `spawn` marks the logo as the colony's nest: on the home page the ants pour out of it.
export function Nav({ spawn = false, solid = false }: { spawn?: boolean; solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filled = solid || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
        filled ? "bg-white/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className={`${wrap} flex h-16 items-center justify-between gap-6 lg:h-[72px]`}>
        <Link href="/" className="relative z-10 -m-2 p-2" aria-label="geeknative home">
          <Logo spawn={spawn} className="text-[20px] lg:text-[22px]" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group relative py-2 text-[14.5px] font-medium tracking-[-0.005em] text-ink/80 transition-colors hover:text-ink"
                >
                  {item.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brand transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={links.github}
            className="hidden size-10 items-center justify-center rounded-full text-ink/80 transition-colors hover:text-ink sm:inline-flex"
            aria-label="geeknative on GitHub"
          >
            <GitHubIcon className="size-[19px]" />
          </a>
          <div className="hidden sm:block">
            <Button href="/docs/start-here/quick-start/" className="h-10 px-5 text-[14px]">
              Get started
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="relative z-10 -mr-2 inline-flex size-11 items-center justify-center lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 top-0 h-[1.5px] w-6 bg-ink transition-transform duration-500 ease-[var(--ease-expo)] ${open ? "translate-y-[5.25px] rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-[1.5px] w-6 bg-ink transition-transform duration-500 ease-[var(--ease-expo)] ${open ? "-translate-y-[5.25px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 top-16 bg-white transition-[opacity,visibility] duration-500 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <nav aria-label="Mobile" className={`${wrap} flex h-full flex-col pb-10 pt-6`}>
          <ul className="border-t border-line">
            {nav.map((item, i) => (
              <li key={item.label} className="border-b border-line">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-5 text-[1.75rem] font-semibold tracking-[-0.03em] wide"
                >
                  <span>{item.label}</span>
                  <span className="label text-faint">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-6">
            <Button href="/docs/start-here/quick-start/" className="w-full justify-between">
              Get started
            </Button>
            <a href={links.github} className="flex items-center justify-between text-lg">
              GitHub <Arrow direction="up-right" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
