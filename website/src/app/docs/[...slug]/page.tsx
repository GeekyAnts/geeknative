import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocBody } from "@/components/docs/DocBody";
import { Toc } from "@/components/docs/Toc";
import { Arrow, Eyebrow } from "@/components/ui/primitives";
import { allDocs, getDoc, neighbors } from "@/lib/docs/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return allDocs().map((d) => ({ slug: d.slug.split("/") }));
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = allDocs().find((d) => d.slug === slug.join("/"));
  if (!doc) return {};
  return { title: doc.title, description: doc.description, openGraph: { title: `${doc.title} · geeknative`, description: doc.description } };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDoc(slug.join("/"));
  if (!doc) notFound();
  const { prev, next } = neighbors(doc.slug);

  return (
    <>
      <article className="min-w-0 pb-24 pt-10 lg:pt-14" data-pagefind-body>
        <header className="max-w-[46rem] border-b border-line pb-10">
          <Eyebrow index={`0${doc.section.index}`} className="text-muted">
            {doc.section.title}
          </Eyebrow>
          <h1 className="mt-6 display-m" data-pagefind-meta="title">
            {doc.title}
          </h1>
          {doc.description ? <p className="mt-5 max-w-[40rem] text-[1.125rem] leading-[1.55] text-ink/70">{doc.description}</p> : null}
        </header>

        <div className="mt-10 max-w-[46rem]">
          <DocBody key={doc.slug} chunks={doc.chunks} />
        </div>

        <footer className="mt-20 max-w-[46rem]" data-pagefind-ignore>
          <a
            href={doc.editUrl}
            className="label inline-flex items-center gap-2 text-muted transition-colors hover:text-ink"
            rel="noreferrer"
          >
            Edit this page on GitHub <Arrow direction="up-right" />
          </a>
          <nav aria-label="Previous and next" className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2">
            {prev ? (
              <Link href={prev.href} className="group flex flex-col gap-3 bg-white p-6 transition-colors hover:bg-mist">
                <span className="label text-muted">Previous</span>
                <span className="flex items-center gap-3 text-[1.35rem] font-[700] leading-[1.1] tracking-[-0.025em] wide">
                  <Arrow className="rotate-180 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-x-1" />
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden bg-white sm:block" />
            )}
            {next ? (
              <Link href={next.href} className="group flex flex-col items-end gap-3 bg-white p-6 text-right transition-colors hover:bg-mist">
                <span className="label text-muted">Next</span>
                <span className="flex items-center gap-3 text-[1.35rem] font-[700] leading-[1.1] tracking-[-0.025em] wide">
                  {next.title}
                  <Arrow className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
                </span>
              </Link>
            ) : (
              <span className="hidden bg-white sm:block" />
            )}
          </nav>
        </footer>
      </article>
      <Toc items={doc.toc} />
    </>
  );
}
