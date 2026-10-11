"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dot } from "@/components/ui/primitives";
import type { SidebarSection } from "@/lib/docs/content";
import { trimSlash } from "@/lib/docs/nav";
import { SearchButton } from "./Search";

function Sections({ sections, current, onNavigate }: { sections: SidebarSection[]; current: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-9">
      {sections.map((section) => {
        const active = section.pages.some((p) => trimSlash(p.href) === current);
        return (
          <div key={section.id}>
            <p className={`label flex items-center gap-2.5 ${active ? "text-ink" : "text-muted"}`}>
              {active ? <Dot /> : <span aria-hidden className="inline-block size-[7px] shrink-0 rounded-full bg-line-strong" />}
              <span className="tabular-nums">0{section.index}</span>
              <span className="h-px w-3 bg-current opacity-30" />
              <span>{section.title}</span>
            </p>
            <ul className="mt-4 border-l border-line">
              {section.pages.map((page) => {
                const on = trimSlash(page.href) === current;
                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      onClick={onNavigate}
                      aria-current={on ? "page" : undefined}
                      className={`-ml-px block border-l py-1.5 pl-4 text-[14.5px] leading-[1.35] transition-colors ${
                        on ? "border-brand font-medium text-ink" : "border-transparent text-ink/65 hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function DocsSidebar({ sections }: { sections: SidebarSection[] }) {
  const pathname = trimSlash(usePathname() ?? "/docs");
  const [open, setOpen] = useState(false);
  const current = sections.flatMap((s) => s.pages).find((p) => trimSlash(p.href) === pathname);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Desktop: a sticky column. */}
      <aside className="hidden lg:block">
        <div className="sticky top-[72px] -ml-1 max-h-[calc(100vh-72px)] overflow-y-auto pb-16 pl-1 pr-3 pt-12 [scrollbar-width:thin]">
          <SearchButton className="mb-10 w-full" />
          <Sections sections={sections} current={pathname} />
        </div>
      </aside>

      {/* Mobile: a disclosure above the article. */}
      <div className="sticky top-16 z-30 -mx-5 border-b border-line bg-white/90 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:hidden">
        <div className="flex h-12 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="docs-mobile-nav"
            className="label flex min-w-0 items-center gap-2.5 text-ink"
          >
            <span className={`inline-block transition-transform duration-300 ${open ? "rotate-90" : ""}`} aria-hidden>
              ›
            </span>
            <span className="truncate">{current ? current.title : "Documentation"}</span>
          </button>
          <SearchButton compact />
        </div>
        {open ? (
          <nav id="docs-mobile-nav" aria-label="Docs" className="max-h-[70vh] overflow-y-auto border-t border-line pb-8 pt-6">
            <Sections sections={sections} current={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        ) : null}
      </div>
    </>
  );
}
