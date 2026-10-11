"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";

// Words darken one by one as the paragraph travels up the viewport.
export function ScrubText({
  text,
  className = "",
  accentFrom,
  decorative = false,
}: {
  text: string;
  className?: string;
  accentFrom?: number;
  decorative?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.86 - r.top) / (r.height + vh * 0.42);
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <p ref={ref} aria-hidden={decorative || undefined} className={`scrub ${className}`} style={{ "--p": 1 } as CSSProperties}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            className={accentFrom !== undefined && i >= accentFrom ? "text-brand" : undefined}
            style={{ "--t": (i / words.length).toFixed(4) } as CSSProperties}
          >
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </p>
  );
}
