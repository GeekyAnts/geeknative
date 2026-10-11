import { Fragment, type ReactNode } from "react";

// A small highlighter in the page's palette: strings in red, keywords in ink, comments muted.
const KEYWORDS = new Set(
  "static let var func enum struct class import val object fun const export return get type as true false nonisolated".split(" "),
);
const TOKEN = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/[^\n]*|<!--[\s\S]*?-->|<\/?[\w-]+|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w]*\b|--[\w-]+)/g;

export function highlight(code: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of code.matchAll(TOKEN)) {
    const t = match[0];
    const at = match.index ?? 0;
    if (at > last) out.push(code.slice(last, at));
    let cls = "";
    if (t.startsWith('"') || t.startsWith("'")) cls = "text-brand";
    else if (t.startsWith("//") || t.startsWith("<!--")) cls = "text-faint";
    else if (t.startsWith("<")) cls = "text-ink/55";
    else if (t.startsWith("--")) cls = "text-ink";
    else if (/^\d/.test(t)) cls = "text-ink";
    else if (KEYWORDS.has(t)) cls = "font-semibold text-ink";
    out.push(cls ? <span key={i++} className={cls}>{t}</span> : <Fragment key={i++}>{t}</Fragment>);
    last = at + t.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodePane({ title, label, code, className = "" }: { title: string; label?: string; code: string; className?: string }) {
  return (
    <figure className={`flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-mist ring-1 ring-inset ring-line ${className}`}>
      <figcaption className="label flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-muted">
        <span className="truncate text-ink">{title}</span>
        {label ? <span className="shrink-0">{label}</span> : null}
      </figcaption>
      <pre className="overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.7] text-ink/80 [scrollbar-width:thin]">
        <code>{highlight(code)}</code>
      </pre>
    </figure>
  );
}
