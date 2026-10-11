"use client";

import { useState } from "react";
import { CodePane } from "@/components/ui/Code";

// Real contract excerpts from the template, and the code `make gen` writes for each app.
const TABS = [
  {
    id: "tokens",
    name: "Design tokens",
    source: {
      title: "contracts/tokens.json",
      code: `"color": {
  "primary": { "light": "#4F46E5", "dark": "#A5B4FC" }
},
"spacing": { "md": 12 },
"typography": {
  "title": { "size": 20, "weight": 600,
             "ios": "title3", "android": "titleLarge" }
}`,
    },
    outputs: [
      {
        title: "Generated/Tokens.swift",
        label: "iOS",
        code: `static let primary = Color(light: 0x4F46E5FF,
                           dark: 0xA5B4FCFF)
static let md: CGFloat = 12
static let title: Font = .title3.weight(.semibold)`,
      },
      {
        title: "generated/Tokens.kt",
        label: "Android",
        code: `primary = Color(0xFF4F46E5),
val md = 12.dp
val title = TextStyle(fontWeight = FontWeight.SemiBold,
  fontSize = 20.sp, lineHeight = 26.sp)`,
      },
      {
        title: "generated/tokens.css",
        label: "Web",
        code: `--color-primary: #4f46e5;
--spacing-md: 12px;
--text-title: 1.25rem;
.dark { --color-primary: #a5b4fc; }`,
      },
    ],
  },
  {
    id: "strings",
    name: "Strings",
    source: {
      title: "contracts/strings/en.json",
      code: `"settings.title": "Settings",
"settings.about.version": "Version {version} ({build:int})",
"notes.count": {
  "one": "{count} note",
  "other": "{count} notes"
}`,
    },
    outputs: [
      {
        title: "Generated/Strings.swift",
        label: "iOS",
        code: `static var settingsTitle: String
static func settingsAboutVersion(
  version: String, build: Int) -> String
// + Localizable.xcstrings, plurals included`,
      },
      {
        title: "res/values/generated_strings.xml",
        label: "Android",
        code: `<string name="settings_title">Settings</string>
<string name="settings_about_version">Version %1$s (%2$d)</string>
<plurals name="notes_count">…</plurals>`,
      },
      {
        title: "generated/strings.ts",
        label: "Web",
        code: `strings.settingsTitle
strings.settingsAboutVersion({ version, build })
strings.notesCount(3) // Intl.PluralRules`,
      },
    ],
  },
  {
    id: "icons",
    name: "Icons",
    source: {
      title: "contracts/icons.json",
      code: `"settings": {
  "ios": "gearshape",
  "android": "Icons.Filled.Settings",
  "web": "Settings"
}`,
    },
    outputs: [
      { title: "Generated/Icons.swift", label: "iOS", code: `static let settings = "gearshape"\n// Image(systemName: AppIcon.settings)` },
      {
        title: "generated/Icons.kt",
        label: "Android",
        code: `val settings: ImageVector
  get() = Icons.Filled.Settings`,
      },
      { title: "generated/icons.ts", label: "Web", code: `import { Settings } from 'lucide-react'\nsettings: Settings,` },
    ],
  },
  {
    id: "identity",
    name: "App identity",
    source: {
      title: "contracts/app.json",
      code: `{
  "name": "My App",
  "id": "com.acme.myapp",
  "version": "1.0.0",
  "build": 1
}`,
    },
    outputs: [
      { title: "Config/Identity.xcconfig", label: "iOS", code: `APP_DISPLAY_NAME = My App\nAPP_BUNDLE_ID = com.acme.myapp\nAPP_VERSION = 1.0.0` },
      { title: "app/identity.properties", label: "Android", code: `applicationId=com.acme.myapp\nversionName=1.0.0\nversionCode=1` },
      { title: "generated/app.ts", label: "Web", code: `export const AppIdentity = {\n  name: "My App",\n  version: "1.0.0",\n} as const` },
    ],
  },
];

export function ContractsShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];
  return (
    <div>
      <div role="tablist" aria-label="Contracts" className="flex flex-wrap gap-x-8 gap-y-3 border-b border-line">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`relative -mb-px pb-4 text-[1.05rem] font-[640] tracking-[-0.02em] transition-colors wide ${
              i === active ? "text-ink" : "text-ink/45 hover:text-ink/75"
            }`}
          >
            {t.name}
            <span className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand transition-transform duration-500 ease-[var(--ease-expo)] ${i === active ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        ))}
      </div>
      <div role="tabpanel" key={tab.id} className="mt-8 grid grid-cols-1 animate-[fade-in_0.6s_var(--ease-expo)] gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CodePane title={tab.source.title} label="You write" code={tab.source.code} className="h-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:col-span-7">
          {tab.outputs.map((o) => (
            <CodePane key={o.title} title={o.title} label={o.label} code={o.code} />
          ))}
        </div>
      </div>
      <p className="label mt-6 text-muted">Fig. 05 · make gen writes these. Nobody edits them by hand, and make check fails if they drift.</p>
    </div>
  );
}
