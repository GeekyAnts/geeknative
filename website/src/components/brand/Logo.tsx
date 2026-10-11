import { BRAND_RED, MARK_ANTENNAE, MARK_DISC, MARK_SEGMENTS, MARK_STROKE } from "@/lib/brand";

// The geeknative mark: three segments, one ant. Each segment is one native app.
export function Mark({
  className = "",
  disc = BRAND_RED,
  ant = "#fff",
  title,
}: {
  className?: string;
  disc?: string;
  ant?: string;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle {...MARK_DISC} fill={disc} />
      <g fill={ant}>
        {MARK_SEGMENTS.map((s, i) => (
          <circle key={i} {...s} />
        ))}
      </g>
      <g fill="none" stroke={ant} strokeWidth={MARK_STROKE} strokeLinecap="round">
        {MARK_ANTENNAE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

// Mark and wordmark. The wordmark is live Archivo, set wide and tight like the headlines.
export function Logo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <span className={`inline-flex items-center gap-[0.42em] ${tone === "white" ? "text-white" : "text-ink"} ${className}`}>
      <Mark className="h-[1.18em] w-[1.18em] shrink-0" />
      <span className="text-[1em] font-[760] leading-none tracking-[-0.035em] wide">geeknative</span>
    </span>
  );
}

// A top-down ant, drawn to match the colony's rendering. Used in legends.
export function AntGlyph({ className = "", color = BRAND_RED }: { className?: string; color?: string }) {
  return (
    <svg viewBox="-0.62 -0.4 1.24 0.8" className={className} aria-hidden>
      <g stroke={color} strokeWidth="0.035" strokeLinecap="round" fill="none">
        <path d="M0.13 0.035 L0.21 0.17 L0.33 0.265 M0.13 -0.035 L0.21 -0.17 L0.33 -0.265" />
        <path d="M0.075 0.045 L0.075 0.2 L0.045 0.335 M0.075 -0.045 L0.075 -0.2 L0.045 -0.335" />
        <path d="M0.02 0.045 L-0.05 0.185 L-0.21 0.315 M0.02 -0.045 L-0.05 -0.185 L-0.21 -0.315" />
        <path d="M0.35 0.035 L0.425 0.115 L0.545 0.14 M0.35 -0.035 L0.425 -0.115 L0.545 -0.14" />
      </g>
      <g fill={color}>
        <ellipse cx="-0.265" cy="0" rx="0.205" ry="0.142" />
        <ellipse cx="-0.072" cy="0" rx="0.044" ry="0.036" />
        <ellipse cx="0.075" cy="0" rx="0.135" ry="0.066" />
        <ellipse cx="0.285" cy="0" rx="0.098" ry="0.09" />
      </g>
    </svg>
  );
}
