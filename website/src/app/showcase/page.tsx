import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/articles/JsonLd";
import { Arrow, Eyebrow, Stop } from "@/components/ui/primitives";
import { showcaseApps, showcaseHref } from "@/content/showcase";
import { absoluteUrl, breadcrumbs, ogImage } from "@/lib/seo";

const title = "Showcase";
const heading = "Apps built with geeknative";
const description = "The same product in SwiftUI, Jetpack Compose and TanStack Start, built from one spec.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/showcase/") },
  openGraph: { title: `${heading} · geeknative`, description, url: absoluteUrl("/showcase/"), images: [ogImage] },
};

export default function Page() {
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: heading,
      description,
      url: absoluteUrl("/showcase/"),
      hasPart: showcaseApps.map((app) => ({ "@type": "SoftwareApplication", name: app.name, url: absoluteUrl(showcaseHref(app.slug)) })),
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: title, path: "/showcase/" },
    ]),
  ];

  return (
    <div className="pb-24 pt-10 lg:pt-14">
      <JsonLd data={structured} />
      <header className="grid grid-cols-1 gap-y-8 border-b border-line pb-12 xl:grid-cols-12 xl:gap-x-6">
        <div className="xl:col-span-8">
          <Eyebrow className="text-muted">{title}</Eyebrow>
          <h1 className="mt-6 display-l">
            {heading}
            <Stop />
          </h1>
        </div>
        <p className="text-[1.125rem] leading-[1.55] text-ink/70 xl:col-span-4 xl:self-end">{description}</p>
      </header>
      <ul>
        {showcaseApps.map((app, i) => (
          <li key={app.slug} className="border-b border-line">
            <Link href={showcaseHref(app.slug)} className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-2 py-7 xl:grid-cols-12 xl:py-9">
              <span className="label hidden tabular-nums text-brand xl:col-span-1 xl:block">{String(i + 1).padStart(2, "0")}</span>
              <span className="xl:col-span-4">
                <span className="block text-[1.4rem] font-[690] leading-[1.1] tracking-[-0.028em] transition-colors group-hover:text-brand wide">{app.name}</span>
                <span className="label mt-2 block text-muted">SwiftUI, Jetpack Compose, TanStack Start</span>
              </span>
              <span className="order-3 col-span-2 text-[15.5px] leading-[1.55] text-ink/65 xl:order-none xl:col-span-6">{app.summary}</span>
              <span className="flex justify-end xl:col-span-1">
                <Arrow className="text-ink/40 transition-all duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1 group-hover:text-ink" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
