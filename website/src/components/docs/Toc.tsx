"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/docs/markdown";

// "On this page": follows the reader, highlighting the section nearest the top of the viewport.
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length) return;
    const headings = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => Boolean(el));
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = items.find((i) => visible.has(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-88px 0px -62% 0px" },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return <div className="hidden xl:block" />;

  return (
    <aside className="hidden xl:block" aria-label="On this page">
      <div className="sticky top-[72px] max-h-[calc(100vh-72px)] overflow-y-auto pb-16 pt-14">
        <p className="label text-muted">On this page</p>
        <ul className="mt-5 space-y-2 border-l border-line">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`-ml-px block border-l py-0.5 text-[13.5px] leading-[1.4] transition-colors ${item.depth === 3 ? "pl-7" : "pl-4"} ${
                  active === item.id ? "border-brand text-ink" : "border-transparent text-ink/55 hover:text-ink"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
