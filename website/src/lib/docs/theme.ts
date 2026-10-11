import type { ThemeRegistration } from "shiki";

// Code in the site's palette: ink type, red keywords, deep-red strings, quiet punctuation and comments.
const INK = "#0b0b0b";
const RED = "#ca0515";
const DEEP = "#9f0310";
const MUTED = "#686664";
const FAINT = "#a3a09c";

export const geeknativeTheme: ThemeRegistration = {
  name: "geeknative",
  type: "light",
  colors: {
    "editor.background": "#f5f4f2",
    "editor.foreground": INK,
  },
  tokenColors: [
    { settings: { foreground: INK } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: FAINT, fontStyle: "italic" } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "variable.language"],
      settings: { foreground: RED },
    },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: DEEP } },
    // Shell arguments (`make doctor`, `cd my-app`) stay ink; only quoted strings are red.
    { scope: ["string.unquoted", "string.unquoted.argument"], settings: { foreground: INK } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: RED } },
    { scope: ["support.type.property-name", "meta.object-literal.key", "entity.name.tag"], settings: { foreground: INK } },
    { scope: ["entity.name.function", "support.function", "entity.name.command"], settings: { foreground: INK, fontStyle: "bold" } },
    { scope: ["entity.name.type", "entity.name.class", "support.class", "support.type"], settings: { foreground: INK } },
    { scope: ["variable.parameter", "constant.other.option", "variable.other.normal"], settings: { foreground: MUTED } },
    { scope: ["punctuation", "keyword.operator", "meta.brace"], settings: { foreground: MUTED } },
    { scope: ["markup.heading", "entity.name.section"], settings: { foreground: INK, fontStyle: "bold" } },
    { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    { scope: ["markup.inline.raw", "markup.fenced_code"], settings: { foreground: DEEP } },
  ],
};
