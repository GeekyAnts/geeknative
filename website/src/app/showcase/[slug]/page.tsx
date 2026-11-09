import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/articles/JsonLd";
import { AppShowcase } from "@/components/showcase/AppShowcase";
import { Eyebrow, Stop } from "@/components/ui/primitives";
import { getShowcase, showcaseApps, showcaseHref, type ShowcaseApp } from "@/content/showcase";
import { absoluteUrl, breadcrumbs, ogImage } from "@/lib/seo";

const PLATFORMS = ["ios", "web", "android"] as const;
const MODES = ["light", "dark"] as const;

/** Files present for this app, so the page never points at a missing capture. */
function capturedShots(app: ShowcaseApp) {
  const dir = path.join(process.cwd(), "public", app.shotPrefix.replace(/^\/geeknative\//, ""));
  return PLATFORMS.flatMap((platform) =>
    app.screens.flatMap((screen) => MODES.map((mode) => `${platform}-${screen.id}-${mode}.webp`)),
  ).filter((file) => existsSync(path.join(dir, file)));
}

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => showcaseApps.map((app) => ({ slug: app.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = getShowcase(slug);
  if (!app) return {};
  return {
    title: app.name,
    description: app.summary,
    alternates: { canonical: absoluteUrl(showcaseHref(app.slug)) },
    openGraph: {
      title: `${app.name} · geeknative`,
      description: app.summary,
      url: absoluteUrl(showcaseHref(app.slug)),
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const app = getShowcase(slug);
  if (!app) notFound();

  return (
    <div className="pb-24 pt-10 lg:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: app.name,
            applicationCategory: "LifestyleApplication",
            operatingSystem: "iOS, Android, Web",
            description: app.summary,
            url: absoluteUrl(showcaseHref(app.slug)),
          },
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Showcase", path: "/showcase/" },
            { name: app.name, path: showcaseHref(app.slug) },
          ]),
        ]}
      />
      <header className="max-w-[46rem]">
        <Eyebrow className="text-muted">
          <Link href="/showcase/" className="hover:text-ink">
            Showcase
          </Link>
        </Eyebrow>
        <h1 className="mt-6 display-l">
          {app.name}
          <Stop />
        </h1>
        <p className="mt-6 text-[1.125rem] leading-[1.55] text-ink/70">{app.summary}</p>
        <p className="label mt-6 text-muted">SwiftUI, Jetpack Compose and TanStack Start. The same screen on all three.</p>
      </header>
      <div className="mt-16">
        <AppShowcase app={app} shots={capturedShots(app)} />
      </div>
    </div>
  );
}
