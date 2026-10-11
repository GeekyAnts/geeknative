import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ColonyToggle } from "@/components/ui/live";
import { wrap } from "@/components/ui/primitives";
import { footer, links } from "@/content/site";

const columns = [
  { title: "Docs", links: footer.docs },
  { title: "Project", links: footer.project },
  { title: "GeekyAnts", links: footer.geekyants },
];

export function Footer({ colony = false }: { colony?: boolean }) {
  return (
    <footer className="border-t border-line bg-paper">
      <div className={`${wrap} grid gap-y-14 py-20 lg:grid-cols-12 lg:gap-x-6 lg:py-24`}>
        <div className="flex flex-col gap-8 lg:col-span-5">
          <Logo className="self-start text-[26px]" />
          <p className="max-w-[24rem] text-[15px] leading-[1.6] text-ink/65">
            One prompt, three native apps. An open source framework that lets your coding agent build SwiftUI, Jetpack
            Compose and TanStack Start apps from one spec. Built by GeekyAnts.
          </p>
          {colony ? <ColonyToggle className="self-start" /> : null}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:col-span-7">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="label text-muted">{col.title}</p>
              <ul className="mt-5 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("http") ? (
                      <a href={l.href} className="text-[14.5px] text-ink/80 transition-colors hover:text-brand">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[14.5px] text-ink/80 transition-colors hover:text-brand">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <div className={`${wrap} label flex flex-col gap-4 py-6 text-muted md:flex-row md:items-center md:justify-between`}>
          <span>© 2026 GeekyAnts. Apache 2.0 license.</span>
          <span>
            The ants come from{" "}
            <a href={links.colony} className="text-ink hover:text-brand">
              the GeekyAnts colony
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
