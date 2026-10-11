// The architecture diagram: one request, traced from the prompt to three tested apps.
// Drawn in the page's language: hairlines, mono labels, and the request's path in red.

const RED = "var(--color-brand)";
const INK = "var(--color-ink)";
const LINE = "rgb(11 11 11 / 0.22)";
const MUTED = "var(--color-muted)";
const MIST = "var(--color-mist)";
const mono = { fontFamily: "var(--font-mono)" } as const;
const sans = { fontFamily: "var(--font-sans)", fontStretch: "110%" } as const;

function Step({ x, n, title }: { x: number; n: string; title: string }) {
  return (
    <g>
      <text x={x} y={34} fontSize={11} letterSpacing="0.06em" fill={RED} style={mono}>
        {n}
      </text>
      <text x={x + 26} y={34} fontSize={11} letterSpacing="0.06em" fill={MUTED} style={mono}>
        {title.toUpperCase()}
      </text>
    </g>
  );
}

function File({ x, y, w, name, note, hot = false }: { x: number; y: number; w: number; name: string; note?: string; hot?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={note ? 46 : 32} rx={7} fill={hot ? "#fff" : MIST} stroke={hot ? RED : LINE} strokeWidth={hot ? 1.5 : 1} />
      <text x={x + 12} y={y + 20} fontSize={12.5} fill={INK} style={mono}>
        {name}
      </text>
      {note ? (
        <text x={x + 12} y={y + 36} fontSize={11} fill={MUTED} style={mono}>
          {note}
        </text>
      ) : null}
    </g>
  );
}

function Flow({ d, hot = false, dashed = false }: { d: string; hot?: boolean; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={hot ? RED : "rgb(11 11 11 / 0.35)"}
      strokeWidth={hot ? 1.6 : 1.2}
      strokeDasharray={dashed ? "4 5" : undefined}
      markerEnd={hot ? "url(#arrow-hot)" : "url(#arrow)"}
    />
  );
}

const TRIAGE = ["Product", "Feature", "Behavior", "Design", "Copy", "Bug", "Platform-specific", "Engineering", "Question"];
const APPS = [
  { y: 96, dir: "apps/ios", stack: "SwiftUI", files: "NotesScreen.swift · NotesViewModel.swift" },
  { y: 262, dir: "apps/android", stack: "Jetpack Compose", files: "NotesScreen.kt · NotesViewModel.kt" },
  { y: 428, dir: "apps/web", stack: "TanStack Start", files: "NotesScreen.tsx · useNotesViewModel.ts" },
];

export function ArchitectureDiagram({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-x-auto [scrollbar-width:thin] ${className}`}>
      <svg viewBox="0 0 1240 600" className="h-auto w-full min-w-[980px]" role="img" aria-labelledby="arch-title arch-desc">
        <title id="arch-title">How a prompt becomes three native apps</title>
        <desc id="arch-desc">
          A prompt goes to AGENTS.md, which triages it and updates the spec and contracts. make gen compiles the contracts into
          each app. The iOS, Android and web apps are built from the spec, then make check runs every app&apos;s tests and make
          parity records coverage.
        </desc>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="rgb(11 11 11 / 0.45)" />
          </marker>
          <marker id="arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={RED} />
          </marker>
          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgb(11 11 11 / 0.07)" />
          </pattern>
        </defs>
        <rect width="1240" height="600" fill="url(#dots)" />

        <Step x={24} n="01" title="Prompt" />
        <Step x={228} n="02" title="Triage" />
        <Step x={444} n="03" title="Source of truth" />
        <Step x={702} n="04" title="Codegen" />
        <Step x={858} n="05" title="Three apps" />
        <Step x={1100} n="06" title="Verify" />

        {/* 01: the prompt */}
        <g>
          <rect x={24} y={226} width={176} height={128} rx={14} fill={INK} />
          <path d="M60 354 L52 374 L80 354 Z" fill={INK} />
          <text x={42} y={256} fontSize={11} letterSpacing="0.06em" fill="rgb(255 255 255 / 0.55)" style={mono}>
            YOU
          </text>
          {["Add a notes list", "where I can add", "and delete notes."].map((line, i) => (
            <text key={line} x={42} y={286 + i * 22} fontSize={15} fontWeight={600} fill="#fff" style={sans}>
              {line}
            </text>
          ))}
        </g>

        {/* 02: AGENTS.md triage */}
        <g>
          <rect x={228} y={92} width={188} height={416} rx={12} fill="#fff" stroke={LINE} />
          <text x={246} y={122} fontSize={15} fontWeight={700} fill={INK} style={sans}>
            AGENTS.md
          </text>
          <text x={246} y={142} fontSize={11} fill={MUTED} style={mono}>
            picks a request type
          </text>
          {TRIAGE.map((t, i) => {
            const hot = t === "Feature";
            return (
              <g key={t}>
                <rect x={246} y={160 + i * 36} width={152} height={28} rx={14} fill={hot ? RED : MIST} />
                <circle cx={262} cy={174 + i * 36} r={3} fill={hot ? "#fff" : "rgb(11 11 11 / 0.3)"} />
                <text x={274} y={178 + i * 36} fontSize={12} fill={hot ? "#fff" : INK} style={mono}>
                  {t}
                </text>
              </g>
            );
          })}
        </g>

        {/* 03: sources of truth */}
        <g>
          <File x={444} y={96} w={226} name="PRODUCT.md" note="what and who" />
          <File x={444} y={154} w={226} name="DESIGN.md" note="look, feel, platform rules" />
          <File x={444} y={212} w={226} name="spec/features/notes.md" note="AC-notes-1 … AC-notes-3" hot />
          <File x={444} y={270} w={226} name="spec/navigation.md" />
          <text x={444} y={336} fontSize={11} letterSpacing="0.06em" fill={MUTED} style={mono}>
            CONTRACTS/
          </text>
          <File x={444} y={348} w={226} name="strings/en.json" note="notes.emptyTitle, …" hot />
          <File x={444} y={406} w={226} name="tokens.json" />
          <File x={444} y={448} w={108} name="icons.json" />
          <File x={562} y={448} w={108} name="app.json" />
        </g>

        {/* 04: make gen */}
        <g>
          <rect x={702} y={470} width={124} height={44} rx={22} fill={INK} />
          <text x={764} y={497} fontSize={13} textAnchor="middle" fill="#fff" style={mono}>
            make gen
          </text>
          {["Generated/*.swift", "generated/*.kt", "generated/*.ts"].map((t, i) => (
            <text key={t} x={764} y={536 + i * 16} fontSize={10.5} textAnchor="middle" fill={MUTED} style={mono}>
              {t}
            </text>
          ))}
        </g>

        {/* 05: the three apps */}
        {APPS.map((a) => (
          <g key={a.dir}>
            <rect x={858} y={a.y} width={214} height={130} rx={12} fill="#fff" stroke={LINE} />
            <text x={876} y={a.y + 28} fontSize={15} fontWeight={700} fill={INK} style={sans}>
              {a.stack}
            </text>
            <text x={876} y={a.y + 48} fontSize={11} fill={MUTED} style={mono}>
              {a.dir} · AGENTS.md
            </text>
            <text x={876} y={a.y + 76} fontSize={10.5} fill={INK} style={mono}>
              {a.files}
            </text>
            <rect x={876} y={a.y + 92} width={110} height={22} rx={11} fill={MIST} />
            <circle cx={889} cy={a.y + 103} r={3} fill={RED} />
            <text x={898} y={a.y + 107} fontSize={10.5} fill={INK} style={mono}>
              AC-notes tests
            </text>
          </g>
        ))}

        {/* 06: verify */}
        <g>
          <rect x={1100} y={226} width={116} height={44} rx={22} fill={INK} />
          <text x={1158} y={253} fontSize={13} textAnchor="middle" fill="#fff" style={mono}>
            make check
          </text>
          <rect x={1100} y={300} width={116} height={62} rx={10} fill="#fff" stroke={RED} strokeWidth={1.5} />
          <text x={1114} y={324} fontSize={11.5} fill={INK} style={mono}>
            spec/
          </text>
          <text x={1114} y={344} fontSize={11.5} fill={INK} style={mono}>
            parity.md
          </text>
          {["✔ contracts", "✔ ios", "✔ android", "✔ web"].map((t, i) => (
            <text key={t} x={1104} y={398 + i * 19} fontSize={11} fill={i === 0 ? MUTED : INK} style={mono}>
              {t}
            </text>
          ))}
        </g>

        {/* the request's path */}
        <Flow d="M200 290 C214 290 214 245 226 245" hot />
        <Flow d="M416 245 C430 245 430 235 442 235" hot />
        <Flow d="M416 245 C432 245 428 370 442 370" hot />
        <Flow d="M670 371 C690 371 686 492 700 492" hot />
        <Flow d="M670 235 C760 235 790 140 856 140" hot dashed />
        <Flow d="M670 235 C760 235 790 300 856 304" hot dashed />
        <Flow d="M670 235 C770 235 800 452 856 466" hot dashed />
        <Flow d="M826 488 C846 488 838 196 856 196" />
        <Flow d="M826 492 C846 492 838 362 856 362" />
        <Flow d="M826 496 C842 496 842 520 856 520" />
        <Flow d="M1072 160 C1090 160 1084 240 1098 246" />
        <Flow d="M1072 326 C1088 326 1086 252 1098 250" />
        <Flow d="M1072 492 C1092 492 1086 258 1098 254" />
        <Flow d="M1158 270 L1158 298" />

        <text x={858} y={588} fontSize={11} fill={MUTED} style={mono}>
          Dashed: built from the spec. Solid: compiled from contracts.
        </text>
      </svg>
    </div>
  );
}
