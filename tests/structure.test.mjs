import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const expected = ["README.md", "package.json", "src/app/dashboard/page.tsx", "src/app/api/health/route.ts", "prisma/schema.prisma", "public/manifest.webmanifest", "docs/FASES.md"];
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
