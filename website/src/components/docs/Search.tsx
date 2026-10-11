"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_PATH } from "@/lib/docs/nav";

// Search across the docs with Pagefind. The index is built after `next build` (`pagefind --site out`)
// and loaded at runtime, so it only exists in the exported site.

const OPEN_EVENT = "geeknative:search";

interface Result {
  url: string;
  title: string;
  excerpt: string;
}

interface Pagefind {
  options: (o: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  search: (q: string) => Promise<{ results: { data: () => Promise<{ url: string; excerpt: string; meta: { title?: string } }> }[] }>;
}

let pagefindPromise: Promise<Pagefind | null> | null = null;

function loadPagefind() {
  if (!pagefindPromise) {
    // A runtime import the bundler leaves alone: the file only exists in the exported site.
    const importAtRuntime = new Function("url", "return import(url)") as (url: string) => Promise<Pagefind>;
    pagefindPromise = importAtRuntime(`${BASE_PATH}/pagefind/pagefind.js`)
      .then(async (pf) => {
        await pf.options({ baseUrl: `${BASE_PATH}/` });
        await pf.init();
        return pf;
      })
      .catch(() => null);
  }
  return pagefindPromise;
}

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function SearchButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <button type="button" onClick={openSearch} className="label inline-flex h-9 items-center gap-2 rounded-full px-3 text-ink ring-1 ring-inset ring-line-strong">
        <SearchIcon className="size-3.5" />
        Search
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={openSearch}
      className={`group flex h-11 items-center gap-3 rounded-full px-4 text-left text-[14px] text-ink/55 ring-1 ring-inset ring-line-strong transition-colors hover:text-ink hover:ring-ink ${className}`}
    >
      <SearchIcon className="size-4" />
      <span className="flex-1">Search docs</span>
      <kbd className="label rounded-md bg-mist px-1.5 py-1 text-[10px] text-muted">⌘K</kbd>
    </button>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5" strokeLinecap="square" />
    </svg>
  );
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    setStatus("loading");
    loadPagefind().then((pf) => setStatus(pf ? "ready" : "unavailable"));
    requestAnimationFrame(() => input.current?.focus());
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const pf = await loadPagefind();
      if (!pf || cancelled) return;
      const search = await pf.search(query);
      const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      if (cancelled) return;
      setResults(data.map((d) => ({ url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt })));
      setSelected(0);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  const go = useCallback(
    (url: string) => {
      close();
      router.push(url.startsWith(BASE_PATH) ? url.slice(BASE_PATH.length) || "/" : url);
    },
    [close, router],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-md" onClick={close} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the docs"
        className="mx-auto mt-[12vh] w-[min(42rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgb(11_11_11/0.35)] ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((s) => Math.min(s + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((s) => Math.max(s - 1, 0));
          }
          if (e.key === "Enter" && results[selected]) go(results[selected].url);
        }}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <SearchIcon className="size-5 text-muted" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the docs"
            className="h-16 flex-1 bg-transparent text-[1.25rem] font-[620] tracking-[-0.02em] outline-none placeholder:text-faint wide"
            aria-label="Search the docs"
          />
          <button type="button" onClick={close} className="label rounded-md bg-mist px-2 py-1 text-muted">
            Esc
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {status === "unavailable" ? (
            <p className="px-5 py-8 text-[15px] leading-[1.6] text-ink/65">
              Search runs on the exported site. Build it with <code className="font-mono text-[13px]">npm run build</code>, then{" "}
              <code className="font-mono text-[13px]">npm run preview</code>.
            </p>
          ) : !query.trim() ? (
            <p className="label px-5 py-8 text-muted">Type to search every page</p>
          ) : results.length === 0 ? (
            <p className="label px-5 py-8 text-muted">{status === "loading" ? "Loading the index" : "No results"}</p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((r, i) => (
                <li key={r.url}>
                  <button
                    type="button"
                    onClick={() => go(r.url)}
                    onMouseEnter={() => setSelected(i)}
                    className={`block w-full px-5 py-4 text-left transition-colors ${i === selected ? "bg-mist" : ""}`}
                  >
                    <span className="flex items-center gap-2 text-[1.05rem] font-[680] tracking-[-0.02em] wide">
                      {i === selected ? <span aria-hidden className="size-[7px] rounded-full bg-brand" /> : null}
                      {r.title}
                    </span>
                    <span
                      className="search-excerpt mt-1.5 block text-[14px] leading-[1.55] text-ink/65"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
