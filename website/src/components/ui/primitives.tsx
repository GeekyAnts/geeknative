import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const wrap = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";

export function Arrow({ className = "", direction = "right" }: { className?: string; direction?: "right" | "up-right" | "down" }) {
  const rotate = direction === "up-right" ? "-rotate-45" : direction === "down" ? "rotate-90" : "";
  return (
    <svg viewBox="0 0 16 16" className={`size-[1em] shrink-0 ${rotate} ${className}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1.5 8h12.5M9 3l5 5-5 5" strokeLinecap="square" />
    </svg>
  );
}

type Tone = "ink" | "white" | "ghost" | "ghost-white";

const tones: Record<Tone, string> = {
  ink: "bg-ink text-white hover:bg-brand",
  white: "bg-white text-brand hover:bg-ink hover:text-white",
  ghost: "text-ink ring-1 ring-inset ring-line-strong hover:ring-ink",
  "ghost-white": "text-white ring-1 ring-inset ring-white/40 hover:ring-white",
};

export function Button({
  href,
  children,
  tone = "ink",
  arrow = true,
  className = "",
  ...rest
}: { href: string; children: ReactNode; tone?: Tone; arrow?: boolean; className?: string } & Omit<ComponentProps<"a">, "href">) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const cls = `group inline-flex h-12 items-center gap-3 rounded-full px-6 text-[15px] font-medium tracking-[-0.005em] transition-colors duration-300 ${tones[tone]} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {arrow ? (
        <span className="relative -mr-1 inline-flex size-4 overflow-hidden">
          <Arrow className="absolute inset-0 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-full" />
          <Arrow className="absolute inset-0 -translate-x-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0" />
        </span>
      ) : null}
    </>
  );
  if (external) {
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={`group inline-flex items-center gap-2 text-[15px] font-medium ${className}`}>
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-[var(--ease-expo)] group-hover:bg-[length:100%_1px]">
        {children}
      </span>
      <Arrow className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
    </a>
  );
}

export function Dot({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block size-[7px] shrink-0 rounded-full bg-brand ${className}`} />;
}

export function Eyebrow({ index, children, className = "" }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`label flex items-center gap-3 ${className}`}>
      <Dot />
      {index ? <span className="tabular-nums">{index}</span> : null}
      {index ? <span className="h-px w-5 bg-current opacity-30" /> : null}
      <span>{children}</span>
    </p>
  );
}

// A full stop in brand red, drawn round to echo the mark: the page's signature.
export function Stop() {
  return (
    <>
      <span className="sr-only">.</span>
      <span aria-hidden className="ml-[0.05em] inline-block aspect-square w-[0.19em] rounded-full bg-brand" />
    </>
  );
}

// A section heading in the page's voice: eyebrow, then a large title ending in the red stop.
export function SectionHead({
  index,
  eyebrow,
  title,
  id,
  className = "",
}: {
  index: string;
  eyebrow: string;
  title: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Eyebrow index={index} className="text-muted">
        {eyebrow}
      </Eyebrow>
      <h2 id={id} className="mt-8 display-l">
        {title}
        <Stop />
      </h2>
    </div>
  );
}
