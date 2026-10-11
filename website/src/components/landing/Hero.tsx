import { ColonyStage } from "@/components/colony/ColonyStage";
import { DeviceLabels, DevicesFallback } from "@/components/colony/StageOverlays";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { Reveal, Words } from "@/components/ui/Reveal";
import { Button, Dot, Stop, TextLink, wrap } from "@/components/ui/primitives";
import { ColonyCount, ColonyHint } from "@/components/ui/live";
import { createCommand } from "@/content/site";

const stack = ["SwiftUI", "Jetpack Compose", "TanStack Start", "Navigation 3", "Observation", "Tailwind CSS", "Swift Testing", "Vitest"];

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col pt-16 lg:pt-[72px]">
      <div className={`${wrap} grid flex-1 grid-cols-1 content-center gap-y-12 py-10 lg:grid-cols-12 lg:gap-x-6 lg:py-12`}>
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-6 lg:self-center">
          <Reveal>
            <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
              <Dot />
              <span>Open source</span>
              <span className="text-faint">/</span>
              <span>By GeekyAnts</span>
              <span className="text-faint">/</span>
              <span>v0.1</span>
            </p>
          </Reveal>
          <Reveal as="h1" className="mt-6 text-[clamp(2.55rem,0.6rem+5.3vw,6rem)] font-[760] leading-[0.94] tracking-[-0.038em] wide lg:mt-8">
            <Words text="One prompt." />{" "}
            <span className="whitespace-nowrap">
              <Words text="Three native" start={2} />
            </span>{" "}
            <Words text="apps" start={4} />
            <Stop />
          </Reveal>
          <Reveal delay={350}>
            <p className="mt-7 max-w-[34rem] text-[1.125rem] leading-[1.55] text-ink/75 lg:mt-9 lg:text-[1.25rem]">
              Describe what you want to your coding agent. It builds the same app in SwiftUI, Jetpack Compose and
              TanStack Start, from one spec, with no cross-platform runtime in between.
            </p>
          </Reveal>
          <Reveal delay={450} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 lg:mt-11">
            <Button href="/docs/start-here/quick-start/">Get started</Button>
            <TextLink href="#how-it-works">See how it works</TextLink>
          </Reveal>
          <Reveal delay={550} className="mt-8 max-w-[36rem]">
            <CopyCommand command={createCommand} />
          </Reveal>
        </div>

        <figure className="order-1 mx-auto w-full max-w-[min(92vw,560px)] lg:order-2 lg:col-span-6 lg:max-w-none lg:self-center">
          <div className="relative">
            <ColonyStage id="hero" formation="devices" className="aspect-[6/7] w-full sm:aspect-[8/7]">
              <DevicesFallback />
            </ColonyStage>
            <DeviceLabels />
          </div>
          <figcaption className="label mt-10 hidden items-center justify-between gap-4 text-muted lg:flex">
            <span>Fig. 00</span>
            <span className="text-right">
              <ColonyCount stage="hero" fallback="6,400" /> ants. Three apps. One spec.
              <ColonyHint>
                <span className="pointer-coarse:hidden"> Stir them with your cursor.</span>
              </ColonyHint>
            </span>
          </figcaption>
        </figure>
      </div>

      <div className="border-t border-line">
        <div className={`${wrap} grid grid-cols-1 gap-5 py-6 lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:py-7`}>
          <p className="label text-muted lg:col-span-2">Built natively with</p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 lg:col-span-10 lg:justify-between">
            {stack.map((s) => (
              <li key={s} className="text-[1.05rem] font-[640] tracking-[-0.02em] text-ink/70 wide">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
