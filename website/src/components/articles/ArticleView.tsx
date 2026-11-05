import Link from "next/link";
import { DocBody } from "@/components/docs/DocBody";
import { Toc } from "@/components/docs/Toc";
import { Arrow, Button, Eyebrow } from "@/components/ui/primitives";
import { links } from "@/content/site";
import { allArticles, COLLECTIONS, formatDate, readingMinutes, type Article } from "@/lib/articles";
import { absoluteUrl, breadcrumbs, publisher } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

function Breadcrumbs({ article }: { article: Article }) {
  const collection = COLLECTIONS[article.collection];
  return (
    <nav aria-label="Breadcrumb" className="label text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href={`/${article.collection}/`} className="hover:text-ink">
            {collection.title}
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="text-ink/70">
          {article.label}
        </li>
      </ol>
    </nav>
  );
}

/** Closing call to action. Use cases and comparisons also point at GeekyAnts for teams that want help. */
function Cta({ article }: { article: Article }) {
  const services = article.collection !== "blog";
  return (
    <section aria-labelledby="cta-title" className="mt-20 rounded-2xl bg-ink p-8 text-white sm:p-10" data-pagefind-ignore>
      <h2 id="cta-title" className="text-[1.75rem] font-[720] leading-[1.05] tracking-[-0.03em] wide">
        Build your first three apps
      </h2>
      <p className="mt-4 max-w-[34rem] text-[15.5px] leading-[1.6] text-white/75">
        Create a project, run make check, then open it in your coding agent and describe the app you want.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/docs/start-here/quick-start/" tone="white">
          Read the quick start
        </Button>
        <Button href={links.github} tone="ghost-white">
          Star on GitHub
        </Button>
      </div>
      {services ? (
        <p className="mt-8 border-t border-white/15 pt-6 text-[14.5px] leading-[1.6] text-white/70">
          Want a team to build it with you? GeekyAnts, the company behind geeknative, designs and builds native apps for
          startups and enterprises.{" "}
          <a href={links.contact} className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            Talk to GeekyAnts
          </a>
          .
        </p>
      ) : null}
    </section>
  );
}

function More({ article }: { article: Article }) {
  const others = allArticles(article.collection).filter((a) => a.slug !== article.slug);
  if (!others.length) return null;
  return (
    <nav aria-label={`More ${COLLECTIONS[article.collection].title.toLowerCase()}`} className="mt-16" data-pagefind-ignore>
      <p className="label text-muted">More {COLLECTIONS[article.collection].title.toLowerCase()}</p>
      <ul className="mt-4 border-t border-line">
        {others.map((a) => (
          <li key={a.slug} className="border-b border-line">
            <Link href={a.href} className="group flex items-baseline justify-between gap-6 py-4">
              <span className="text-[1.1rem] font-[650] tracking-[-0.02em] transition-colors group-hover:text-brand wide">{a.title}</span>
              <Arrow className="text-ink/40 transition-all duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1 group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ArticleView({ article }: { article: Article }) {
  const collection = COLLECTIONS[article.collection];
  const url = absoluteUrl(article.href);
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": collection.schemaType,
      headline: article.title,
      description: article.description,
      url,
      mainEntityOfPage: url,
      image: absoluteUrl("/opengraph-image.png"),
      ...(article.date ? { datePublished: article.date, dateModified: article.date } : {}),
      author: article.collection === "blog" ? { "@type": "Organization", name: article.author, url: absoluteUrl("/") } : publisher,
      publisher,
      about: { "@type": "SoftwareApplication", name: "geeknative", url: absoluteUrl("/") },
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: collection.title, path: `/${article.collection}/` },
      { name: article.label, path: article.href },
    ]),
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-x-14">
      <JsonLd data={structured} />
      <article className="min-w-0 pb-24 pt-10 lg:pt-14" data-pagefind-body>
        <header className="max-w-[46rem] border-b border-line pb-10">
          <Breadcrumbs article={article} />
          <Eyebrow className="mt-8 text-muted">{collection.title}</Eyebrow>
          <h1 className="mt-6 display-m" data-pagefind-meta="title">
            {article.title}
          </h1>
          <p className="mt-5 max-w-[40rem] text-[1.125rem] leading-[1.55] text-ink/70">{article.description}</p>
          {article.date ? (
            <p className="label mt-6 text-muted">
              <time dateTime={article.date}>{formatDate(article.date)}</time> · {article.author} · {readingMinutes(article.words)} min
              read
            </p>
          ) : null}
        </header>
        <div className="mt-10 max-w-[46rem]">
          <DocBody key={article.slug} chunks={article.chunks} />
          <Cta article={article} />
          <More article={article} />
        </div>
      </article>
      <Toc items={article.toc} />
    </div>
  );
}
