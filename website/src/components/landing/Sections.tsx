import { ColonyStage } from "@/components/colony/ColonyStage";
import { FlowLabels, ParityCells } from "@/components/colony/StageOverlays";
import { ArchitectureDiagram } from "@/components/diagrams/ArchitectureDiagram";
import { DeviceShowcase } from "@/components/showcase/DeviceShowcase";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { Reveal, Words } from "@/components/ui/Reveal";
import { Arrow, Button, Eyebrow, Stop, TextLink, wrap } from "@/components/ui/primitives";
import { createCommand, links } from "@/content/site";
import { Mark } from "@/components/brand/Logo";
import { ContractsShowcase } from "./Contracts";

function Head({ index, eyebrow, title, id, aside }: { index: string; eyebrow: string; title: string; id: string; aside?: string }) {
  return (
    <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-6">
      <div className="lg:col-span-8">
        <Eyebrow index={index} className="text-muted">
          {eyebrow}
        </Eyebrow>
        <Reveal as="h2" className="mt-8 display-l">
          <span id={id}>
            <Words text={title} />
            <Stop />
          </span>
        </Reveal>
      </div>
      {aside ? (
        <Reveal delay={200} className="lg:col-span-4 lg:self-end">
          <p className="text-[1.125rem] leading-[1.55] text-ink/70">{aside}</p>
        </Reveal>
      ) : null}
    </div>
  );
}

/* 02: real screenshots */
export function Apps() {
  return (
    <section id="apps" aria-labelledby="apps-title" className="scroll-mt-16 lg:scroll-mt-[72px] pt-32 lg:pt-44">
      <div className={wrap}>
        <Head
          index="02"
          eyebrow="Real apps"
          id="apps-title"
          title="The same app, built three times"
          aside="These are screenshots of the starter app every project begins with: SwiftUI on iOS, Compose on Android, React in Chrome. Same screens, same copy, same tokens. Native controls everywhere."
        />
      </div>
      <div className="mt-16 bg-mist py-16 lg:mt-20 lg:py-24">
        <div className={wrap}>
          <DeviceShowcase />
        </div>
      </div>
      <div className={`${wrap} label mt-5 flex flex-col gap-2 text-muted sm:flex-row sm:items-center sm:justify-between`}>
        <span>Fig. 02 · Real screenshots: iPhone 17 Pro simulator, Android emulator, Chrome</span>
        <span>Each screen switches all three apps at once</span>
      </div>
    </section>
  );
}

const LOOP = [
  { title: "Update the source of truth", body: "The spec, PRODUCT.md, DESIGN.md or a contract changes first, so every app builds against the same description." },
  { title: "Regenerate", body: "make gen compiles the contracts into Swift, Kotlin, Android resources and TypeScript. Nobody edits generated code." },
  { title: "Build on each platform", body: "Each app follows its own AGENTS.md. Agents that support sub-agents build the three apps in parallel." },
  { title: "Verify", body: "make check builds and tests every app. The agent keeps going until all three pass." },
  { title: "Record and report", body: "Each platform's status goes into the spec, make parity updates the coverage table, and the agent reports one line per platform." },
];

/* 03: how it works */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-16 lg:scroll-mt-[72px] border-t border-line pt-28 lg:pt-40">
      <div className={wrap}>
        <Head
          index="03"
          eyebrow="How it works"
          id="how-title"
          title="A prompt becomes a spec. A spec becomes three apps"
          aside="AGENTS.md teaches any coding agent the same loop: work out what you asked for, write it down once, then build it natively three times and prove it."
        />
        <div className="relative mt-16 lg:mt-20">
          <ColonyStage id="flow" formation="flow" className="aspect-[3/4] w-full sm:aspect-[16/9] lg:aspect-[21/8]" />
          <FlowLabels />
        </div>
        <p className="label mt-16 text-muted">Fig. 03.1 · The loop, carried by the colony</p>

        <div className="mt-24 grid grid-cols-1 gap-y-14 lg:mt-32 lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="label text-muted">The loop</p>
              <p className="mt-6 text-[clamp(1.6rem,1rem+1.6vw,2.6rem)] font-[700] leading-[1.04] tracking-[-0.03em] wide">
                Every request, every time
                <Stop />
              </p>
            </div>
          </div>
          <ol className="lg:col-span-8">
            {LOOP.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-t border-line py-8 first:border-t-0 first:pt-0 sm:grid-cols-[4.5rem_minmax(0,1fr)] lg:py-10 lg:first:pt-2"
              >
                <span className="label pt-2 text-brand tabular-nums">0{i + 1}</span>
                <div>
                  <h3 className="text-[clamp(1.35rem,1rem+1.1vw,2rem)] font-[700] leading-[1.06] tracking-[-0.028em] wide">{step.title}</h3>
                  <p className="mt-4 max-w-[40rem] text-[1.0625rem] leading-[1.6] text-ink/70">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="mt-24 lg:mt-32">
          <ArchitectureDiagram className="rounded-[18px] ring-1 ring-inset ring-line" />
          <div className="label mt-5 flex flex-col gap-2 text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Fig. 03.2 · One request, traced through the repo</span>
            <TextLink href="/geeknative/docs/concepts/how-it-works/" className="text-ink">
              Read how it works
            </TextLink>
          </div>
        </div>
      </div>
    </section>
  );
}

const TRIAGE = [
  { type: "Product", prompt: "Build a habit tracker for runners.", goes: "PRODUCT.md, DESIGN.md, navigation, feature specs" },
  { type: "Feature", prompt: "Add a notes list where I can add and delete notes.", goes: "A new spec/features/notes.md" },
  { type: "Behavior", prompt: "Sort notes by date instead.", goes: "That feature's spec" },
  { type: "Design", prompt: "Make it feel warmer, with rounder corners.", goes: "DESIGN.md and contracts/tokens.json" },
  { type: "Copy", prompt: "Rename Save to Done.", goes: "contracts/strings, then make gen" },
  { type: "Bug", prompt: "Deleting the last note crashes.", goes: "The spec, only if it was silent or wrong" },
  { type: "Platform-specific", prompt: "On iPhone, add a haptic when deleting.", goes: "The spec's Platform notes; iOS only" },
  { type: "Engineering", prompt: "Upgrade Compose to the latest BOM.", goes: "Nothing in the spec" },
  { type: "Question", prompt: "Why does Android use radio buttons here?", goes: "Nothing: the agent answers" },
];

/* 04: triage */
export function Triage() {
  return (
    <section aria-labelledby="triage-title" className="border-t border-line py-28 lg:py-40">
      <div className={`${wrap} grid grid-cols-1 gap-y-14 lg:grid-cols-12 lg:gap-x-6`}>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Eyebrow index="04" className="text-muted">
              Triage
            </Eyebrow>
            <Reveal as="h2" className="mt-8 display-l">
              <span id="triage-title">
                <Words text="Just talk. The agent sorts it out" />
                <Stop />
              </span>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-8 max-w-[26rem] text-[1.0625rem] leading-[1.6] text-ink/70">
                No commands to learn. The agent states how it read your request in one line before it touches anything,
                so you can correct it early:
              </p>
              <p className="mt-6 rounded-[12px] bg-ink px-5 py-4 font-mono text-[13px] leading-[1.6] text-white/90">
                <span className="text-white">Feature:</span> notes list → spec/features/notes.md, strings ·{" "}
                <span className="text-[#ff8a92]">iOS, Android, Web</span>
              </p>
            </Reveal>
          </div>
        </div>
        <ul className="lg:col-span-8">
          {TRIAGE.map((t, i) => (
            <Reveal
              as="li"
              key={t.type}
              className="grid grid-cols-1 gap-y-3 border-t border-line py-7 first:border-t-0 first:pt-0 sm:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[4.5rem_10rem_minmax(0,1fr)] lg:gap-x-6 lg:py-8 lg:first:pt-2"
            >
              <span className="label hidden pt-1.5 text-brand tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
              <span className="label pt-1.5 text-ink">{t.type}</span>
              <div>
                <p className="text-[1.3rem] font-[650] leading-[1.25] tracking-[-0.02em] wide">“{t.prompt}”</p>
                <p className="mt-2 flex items-center gap-2 text-[15px] text-ink/60">
                  <Arrow className="text-brand" />
                  {t.goes}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 05: contracts */
export function Contracts() {
  return (
    <section id="contracts" aria-labelledby="contracts-title" className="scroll-mt-16 lg:scroll-mt-[72px] border-t border-line py-28 lg:py-40">
      <div className={wrap}>
        <Head
          index="05"
          eyebrow="Contracts"
          id="contracts-title"
          title="Write it once. Compile it three ways"
          aside="App identity, design tokens, copy and icons live in contracts/. make gen turns them into code for each app, so a color, a string or a version number can't drift."
        />
        <div className="mt-14 lg:mt-20">
          <ContractsShowcase />
        </div>
      </div>
    </section>
  );
}

const CHECK_OUTPUT = `$ make check
✔ contracts  valid, generated files up to date
▸ ios        building and testing on iPhone 17 Pro (iOS 26.3)…
✔ ios        build and 4 tests passed (60s)
▸ android    building and running unit tests…
✔ android    build and 4 unit tests passed (0s)
▸ web        type-checking, testing and building…
✔ web        types, 6 tests and build passed (3s)`;

/* 06: parity */
export function Parity() {
  return (
    <section aria-labelledby="parity-title" className="border-t border-line py-28 lg:py-40">
      <div className={wrap}>
        <Head
          index="06"
          eyebrow="Parity"
          id="parity-title"
          title="Tests carry the spec. Parity is a table, not a hope"
          aside="Specs number their acceptance criteria. Each app's tests name the criteria they cover, and make parity turns that into a table. Gaps show up before users find them."
        />
        <div className="mt-16 grid grid-cols-1 gap-y-14 lg:mt-24 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <div className="relative mt-8">
              <ColonyStage id="parity" formation="parity" className="h-[330px] w-full sm:h-[360px]" />
              <ParityCells />
            </div>
            <p className="label mt-6 text-muted">Fig. 06 · The starter app&apos;s acceptance criteria, as make parity reports them</p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5">
            <pre className="overflow-x-auto rounded-[14px] bg-ink px-5 py-5 font-mono text-[12.5px] leading-[1.75] text-white/85 [scrollbar-width:thin]">
              {CHECK_OUTPUT.split("\n").map((line, i) => (
                <span key={i} className={line.startsWith("✔") ? "block text-white" : line.startsWith("$") ? "block text-white/60" : "block text-white/55"}>
                  {line.startsWith("✔") ? (
                    <>
                      <span className="text-[#ff8a92]">✔</span>
                      {line.slice(1)}
                    </>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </pre>
            <p className="text-[15px] leading-[1.6] text-ink/65">
              Real output from the starter app. Logs land in .geeknative/logs, so agents read a short summary and open
              the full log only when something fails.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const AGENTS = [
  {
    name: "Claude Code",
    tag: "Subagents + hooks",
    body: "Reads AGENTS.md through one-line CLAUDE.md imports. ios-engineer, android-engineer and web-engineer subagents build in parallel. Hooks regenerate code when a contract changes, and flag a turn that changed only some of the apps.",
  },
  { name: "Codex", tag: "AGENTS.md", body: "Reads AGENTS.md at the root and in each app, and runs the same make targets." },
  { name: "Cursor", tag: "AGENTS.md", body: "Picks up the root and per-app AGENTS.md files as project rules." },
  { name: "GitHub Copilot", tag: "AGENTS.md", body: "The coding agent follows AGENTS.md in pull requests it opens." },
  { name: "Gemini CLI", tag: ".gemini/settings.json", body: "The project setting points Gemini CLI at AGENTS.md instead of GEMINI.md." },
  { name: "Your agent", tag: "Plain files", body: "Markdown instructions, a Makefile, and a CLI with short output and full logs. Nothing to install into the agent." },
];

/* 07: agents */
export function Agents() {
  return (
    <section id="agents" aria-labelledby="agents-title" className="scroll-mt-16 lg:scroll-mt-[72px] border-t border-line py-28 lg:py-40">
      <div className={wrap}>
        <Head
          index="07"
          eyebrow="Agents"
          id="agents-title"
          title="Bring the agent you already use"
          aside="geeknative is plain files in your repo. The instructions follow the AGENTS.md convention, and Claude Code gets extra wiring on top."
        />
        <ul className="mt-16 border-t border-line lg:mt-20">
          {AGENTS.map((a) => (
            <li key={a.name} className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-line py-6 lg:grid-cols-12 lg:items-baseline lg:py-7">
              <span className="text-[1.35rem] font-[680] tracking-[-0.025em] wide lg:col-span-3 lg:text-[1.5rem]">{a.name}</span>
              <span className="text-[15px] leading-[1.6] text-ink/65 lg:col-span-7">{a.body}</span>
              <span className="label text-muted lg:col-span-2 lg:text-right">{a.tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Closing call to action, in red, with the mark drawn in white ants. */
export function Closing() {
  return (
    <section aria-labelledby="start-title" className="relative overflow-hidden bg-brand py-28 text-white lg:py-36">
      <div className={`${wrap} grid grid-cols-1 items-center gap-y-14 lg:grid-cols-12 lg:gap-x-6`}>
        <div className="lg:col-span-7">
          <p className="label flex items-center gap-3 text-white/80">
            <span aria-hidden className="inline-block size-[7px] rounded-full bg-white" />
            Start
          </p>
          <h2 id="start-title" className="mt-8 display-xl">
            Start in a minute.
          </h2>
          <p className="mt-8 max-w-[34rem] text-[1.125rem] leading-[1.6] text-white/85">
            Create a project, run make doctor and make check, then open it in your coding agent and describe the app you
            want.
          </p>
          <CopyCommand command={createCommand} tone="red" className="mt-10 max-w-[40rem]" />
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/docs/start-here/quick-start/" tone="white">
              Read the quick start
            </Button>
            <Button href={links.github} tone="ghost-white">
              Star on GitHub
            </Button>
          </div>
        </div>
        <figure className="mx-auto w-full max-w-[min(78vw,420px)] lg:col-span-5 lg:max-w-none">
          <ColonyStage id="closing" formation="markwhite" className="aspect-square w-full">
            <Mark className="h-full w-full" disc="transparent" ant="#fff" />
          </ColonyStage>
        </figure>
      </div>
    </section>
  );
}
