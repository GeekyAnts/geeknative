"use client";

import { Fragment, createElement, useEffect, useState, type CSSProperties, type ReactNode } from "react";

// Adds `is-in` once the element scrolls into view. The motion itself is CSS
// (see .reveal / .words in globals.css), so server-rendered markup stays intact.
export function Reveal({
  as = "div",
  className = "",
  delay = 0,
  children,
  threshold = 0.15,
}: {
  as?: "div" | "section" | "h1" | "h2" | "h3" | "p" | "ul" | "ol" | "li" | "figure" | "span" | "dl";
  className?: string;
  delay?: number;
  children: ReactNode;
  threshold?: number;
}) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, threshold]);
  return createElement(as, { ref: setEl, className: `reveal ${className}`, style: { "--d": `${delay}ms` } as CSSProperties }, children);
}

// Splits text into words that rise into place when their Reveal parent enters.
export function Words({ text, className = "", start = 0 }: { text: string; className?: string; start?: number }) {
  const words = text.split(" ");
  return (
    <span className={`words ${className}`}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="word">
            <span style={{ "--i": i + start } as CSSProperties}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
