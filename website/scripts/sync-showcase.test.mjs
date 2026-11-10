import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { brandMark } from "./sync-showcase.mjs";

function withTokens(tokens, check) {
  const root = mkdtempSync(path.join(os.tmpdir(), "geeknative-mark-"));
  mkdirSync(path.join(root, "contracts"));
  if (tokens !== undefined) {
    writeFileSync(path.join(root, "contracts", "tokens.json"), JSON.stringify(tokens));
  }
  try {
    check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("shots.mark wins over primary and espresso", () => {
  withTokens({ color: { primary: { light: "#111111" }, espresso: { light: "#35251E" } } }, (root) => {
    assert.equal(brandMark(root, { mark: "  #35251E  " }), "#35251E");
  });
});

test("primary is used and espresso is ignored", () => {
  withTokens({ color: { espresso: { light: "#35251E" }, primary: { light: " #1F3A4D " } } }, (root) => {
    assert.equal(brandMark(root, {}), "#1F3A4D");
    assert.equal(brandMark(root, { mark: "   " }), "#1F3A4D");
  });
});

test("espresso alone falls back, and so does a missing tokens file", () => {
  withTokens({ color: { espresso: { light: "#35251E" } } }, (root) => {
    assert.equal(brandMark(root), "#4F46E5");
  });
  const root = mkdtempSync(path.join(os.tmpdir(), "geeknative-mark-"));
  try {
    assert.equal(brandMark(root, {}), "#4F46E5");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
