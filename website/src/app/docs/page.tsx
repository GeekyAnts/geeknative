import type { Metadata } from "next";
import Link from "next/link";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { Arrow, Eyebrow, Stop } from "@/components/ui/primitives";
import { createCommand } from "@/content/site";
import { sidebar } from "@/lib/docs/content";

export const metadata: Metadata = {
  title: "Docs",
  description: "How to build native iOS, Android and web apps from one spec with geeknative and your coding agent.",
};

export default function DocsHome() {
  const sections = sidebar();
  return (
    <div className="min-w-0 pb-24 pt-10 lg:col-span-1 lg:pt-14 xl:col-span-2">
      <header className="grid grid-cols-1 gap-y-8 border-b border-line pb-12 xl:grid-cols-12 xl:gap-x-6">
        <div className="xl:col-span-8">
          <Eyebrow className="text-muted">Documentation</Eyebrow>
          <h1 className="mt-6 display-l">
            Build three native apps from one prompt
            <Stop />
          </h1>
        </div>
        <div className="xl:col-span-4 xl:self-end">
          <p className="text-[1.125rem] leading-[1.55] text-ink/70">
            How geeknative works, how to talk to your agent, and every command, contract and convention in a project.
          </p>
        </div>
        <div className="xl:col-span-12">
          <CopyCommand command={createCommand} className="max-w-[44rem]" />
        </div>
      </header>

      <div className="mt-4">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`docs-${section.id}`} className="grid grid-cols-1 gap-y-6 border-b border-line py-12 xl:grid-cols-12 xl:gap-x-6">
            <div className="xl:col-span-3">
              <p className="label flex items-center gap-3 text-muted">
                <span className="tabular-nums text-brand">0{section.index}</span>
                <span className="h-px w-5 bg-current opacity-30" />
              </p>
              <h2 id={`docs-${section.id}`} className="mt-4 text-[clamp(1.6rem,1.1rem+1.2vw,2.3rem)] font-[720] leading-[1.02] tracking-[-0.03em] wide">
                {section.title}
              </h2>
            </div>
            <ul className="border-t border-line xl:col-span-9 xl:border-t-0">
              {section.pages.map((page) => (
                <li key={page.href} className="border-b border-line last:border-b-0">
                  <Link
                    href={page.href}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-5 xl:grid-cols-12 xl:py-6"
                  >
                    <span className="text-[1.3rem] font-[680] tracking-[-0.025em] transition-colors group-hover:text-brand wide xl:col-span-4">
                      {page.title}
                    </span>
                    <span className="order-3 col-span-2 text-[15px] leading-[1.55] text-ink/65 xl:order-none xl:col-span-7">
                      {page.description}
                    </span>
                    <span className="flex justify-end xl:col-span-1">
                      <Arrow className="text-ink/40 transition-all duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1 group-hover:text-ink" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
