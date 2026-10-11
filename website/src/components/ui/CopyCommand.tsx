"use client";

import { useState } from "react";

// A shell command with a copy button, set in mono like the page's labels.
export function CopyCommand({ command, tone = "light", className = "" }: { command: string; tone?: "light" | "dark" | "red"; className?: string }) {
  const [copied, setCopied] = useState(false);
  const tones = {
    light: "bg-mist text-ink ring-line",
    dark: "bg-ink text-white ring-white/10",
    red: "bg-white/10 text-white ring-white/30",
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-full py-2 pl-5 pr-2 ring-1 ring-inset ${tones[tone]} ${className}`}>
      <span aria-hidden className={tone === "light" ? "font-mono text-[13px] text-brand" : "font-mono text-[13px] opacity-60"}>
        $
      </span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] [scrollbar-width:none]">{command}</code>
      <button
        type="button"
        onClick={copy}
        className={`label shrink-0 rounded-full px-3.5 py-2 transition-colors ${
          tone === "light" ? "bg-white text-ink ring-1 ring-inset ring-line hover:bg-ink hover:text-white" : "bg-white text-ink hover:bg-ink hover:text-white"
        }`}
        aria-live="polite"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
