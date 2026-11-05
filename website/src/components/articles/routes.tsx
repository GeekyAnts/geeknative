import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { Arrow, Eyebrow, Stop, wrap } from "@/components/ui/primitives";
import { allArticles, COLLECTIONS, formatDate, getArticle, type CollectionId } from "@/lib/articles";
import { absoluteUrl, breadcrumbs, ogImage } from "@/lib/seo";
import { ArticleView } from "./ArticleView";
import { JsonLd } from "./JsonLd";

// Route building blocks shared by /use-cases, /compare and /blog, so each route file stays a few lines.

export function CollectionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav solid />
      <main className={`${wrap} pt-16 lg:pt-[72px]`}>{children}</main>
      <Footer />
    </>
  );
}

export function collectionIndex(id: CollectionId) {
  const c = COLLECTIONS[id];
  const metadata: Metadata = {
    title: c.title,
    description: c.description,
    alternates: { canonical: absoluteUrl(`/${id}/`) },
    openGraph: { title: `${c.heading} · geeknative`, description: c.description, url: absoluteUrl(`/${id}/`), images: [ogImage] },
  };

  function Page() {
    const items = allArticles(id);
    const structured = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: c.heading,
        description: c.description,
        url: absoluteUrl(`/${id}/`),
        hasPart: items.map((a) => ({ "@type": c.schemaType, headline: a.title, url: absoluteUrl(a.href) })),
      },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: c.title, path: `/${id}/` },
      ]),
    ];
    return (
      <div className="pb-24 pt-10 lg:pt-14">
        <JsonLd data={structured} />
        <header className="grid grid-cols-1 gap-y-8 border-b border-line pb-12 xl:grid-cols-12 xl:gap-x-6">
          <div className="xl:col-span-8">
            <Eyebrow className="text-muted">{c.title}</Eyebrow>
            <h1 className="mt-6 display-l">
              {c.heading}
              <Stop />
            </h1>
          </div>
          <p className="text-[1.125rem] leading-[1.55] text-ink/70 xl:col-span-4 xl:self-end">{c.description}</p>
        </header>
        <ul>
          {items.map((a, i) => (
            <li key={a.slug} className="border-b border-line">
              <Link href={a.href} className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-2 py-7 xl:grid-cols-12 xl:py-9">
                <span className="label hidden tabular-nums text-brand xl:col-span-1 xl:block">{String(i + 1).padStart(2, "0")}</span>
                <span className="xl:col-span-4">
                  <span className="block text-[1.4rem] font-[690] leading-[1.1] tracking-[-0.028em] transition-colors group-hover:text-brand wide">
                    {a.title}
                  </span>
                  {a.date ? <span className="label mt-2 block text-muted">{formatDate(a.date)}</span> : null}
                </span>
                <span className="order-3 col-span-2 text-[15.5px] leading-[1.55] text-ink/65 xl:order-none xl:col-span-6">{a.description}</span>
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

  return { metadata, Page };
}

type Props = { params: Promise<{ slug: string }> };

export function articleRoute(id: CollectionId) {
  const generateStaticParams = () => allArticles(id).map((a) => ({ slug: a.slug }));

  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const a = allArticles(id).find((x) => x.slug === slug);
    if (!a) return {};
    return {
      title: a.title,
      description: a.description,
      alternates: { canonical: absoluteUrl(a.href) },
      openGraph: {
        title: `${a.title} · geeknative`,
        description: a.description,
        url: absoluteUrl(a.href),
        images: [ogImage],
        type: "article",
        ...(a.date ? { publishedTime: a.date } : {}),
      },
    };
  }

  async function Page({ params }: Props) {
    const { slug } = await params;
    const article = await getArticle(id, slug);
    if (!article) notFound();
    return <ArticleView article={article} />;
  }

  return { generateStaticParams, generateMetadata, Page };
}
