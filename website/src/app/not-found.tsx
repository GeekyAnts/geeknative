import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { Button, Eyebrow, Stop, TextLink, wrap } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <>
      <Nav solid />
      <main className={`${wrap} flex min-h-[78svh] flex-col justify-center pb-20 pt-32`}>
        <Eyebrow index="404" className="text-muted">
          Page not found
        </Eyebrow>
        <h1 className="mt-8 display-xl">
          Not found
          <Stop />
        </h1>
        <p className="mt-8 max-w-[34rem] text-[1.125rem] leading-[1.55] text-ink/70">
          This page doesn&apos;t exist, or it moved when the docs were reorganized. Start from the docs home, or go back to
          the front page.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Button href="/docs/">Read the docs</Button>
          <TextLink href="/geeknative/">Go to the front page</TextLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
