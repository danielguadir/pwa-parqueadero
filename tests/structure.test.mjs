import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const expected = [
  "README.md",
  "package.json",
  "src/app/page.tsx",
  "src/app/entradas/page.tsx",
  "src/app/salidas/page.tsx",
  "src/app/historial/page.tsx",
  "src/app/configuracion/page.tsx",
  "public/manifest.webmanifest",
  "public/sw.js",
];
test("archivos básicos presentes", () => {
  for (const p of expected) assert.ok(existsSync(join(root, p)), `Falta ${p}`);
});
test("cada carpeta del proyecto tiene su README.md", () => {
  const skip = new Set(["node_modules", ".git", ".next", ".vercel"]);
  function walk(folder) {
    for (const ent of readdirSync(folder)) {
      const path = join(folder, ent);
      if (statSync(path).isDirectory() && !skip.has(ent)) {
        assert.ok(existsSync(join(path, "README.md")), `Falta README.md en ${path}`);
        walk(path);
      }
    }
  }
  walk(root);
});
