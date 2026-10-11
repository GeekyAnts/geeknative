import { ColonyStage } from "@/components/colony/ColonyStage";
import { Reveal } from "@/components/ui/Reveal";
import { ScrubText } from "@/components/ui/ScrubText";
import { CountUp } from "@/components/ui/live";
import { Eyebrow, wrap } from "@/components/ui/primitives";

const stats = [
  { value: 1, label: "Prompt" },
  { value: 3, label: "Native apps" },
  { value: 0, label: "Bridges or shared runtimes" },
  { value: 58, label: "Framework tests" },
];

export function Idea() {
  return (
    <section aria-labelledby="idea" className="pt-28 lg:pt-44">
      <div className={wrap}>
        <Eyebrow index="01" className="text-muted">
          The idea
        </Eyebrow>
        <h2 id="idea" className="sr-only">
          Cross-platform apps, without cross-platform technology.
        </h2>
        <ScrubText
          decorative
          text="Cross-platform apps, without cross-platform technology."
          accentFrom={3}
          className="mt-8 max-w-[18ch] text-[clamp(2.3rem,0.9rem+4.6vw,6.2rem)] font-[740] leading-[0.97] tracking-[-0.036em] wide"
        />
      </div>

      <ColonyStage id="trail" formation="trail" className="mt-6 h-[180px] w-full lg:mt-2 lg:h-[240px]" />

      <div className={`${wrap} grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-6`}>
        <Reveal className="lg:col-span-4">
          <p className="text-[clamp(1.5rem,1rem+1.4vw,2.35rem)] font-[680] leading-[1.08] tracking-[-0.028em] wide">One spec.</p>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-4">
          <p className="text-[clamp(1.5rem,1rem+1.4vw,2.35rem)] font-[680] leading-[1.08] tracking-[-0.028em] wide">
            Three native codebases.
          </p>
        </Reveal>
        <Reveal delay={240} className="lg:col-span-4">
          <p className="text-[clamp(1.5rem,1rem+1.4vw,2.35rem)] font-[680] leading-[1.08] tracking-[-0.028em] text-brand wide">
            Your agent keeps them in step.
          </p>
        </Reveal>
      </div>

      <div className={`${wrap} mt-12 grid grid-cols-1 gap-y-6 lg:mt-16 lg:grid-cols-12 lg:gap-x-6`}>
        <Reveal className="lg:col-span-6 lg:col-start-7">
          <p className="text-[1.125rem] leading-[1.6] text-ink/70">
            Cross-platform frameworks trade native feel for shared code. geeknative keeps the native code and shares
            everything else: the product spec, the design tokens, the copy and the tests. The agent writes SwiftUI for
            iOS, Compose for Android and React for the web, and the shared contracts keep the three apps the same
            product.
          </p>
        </Reveal>
      </div>

      <div className={`${wrap} mt-20 lg:mt-28`}>
        <dl className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 90}
              className={`flex flex-col justify-between gap-10 border-b border-line py-7 pr-4 lg:border-b-0 lg:py-9 ${
                i % 2 === 1 ? "pl-5 lg:pl-6" : "lg:pl-6"
              } ${i > 0 ? "lg:border-l" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""} ${i === 0 ? "lg:pl-0" : ""}`}
            >
              <dt className="label order-2 text-muted">{s.label}</dt>
              <dd className="order-1 text-[clamp(3.2rem,1.4rem+5vw,7rem)] font-[720] leading-[0.86] tracking-[-0.045em] narrow">
                <CountUp value={s.value} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
