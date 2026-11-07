import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package exposes the blazer executable", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.bin.blazer, "./dist/index.js");
  assert.ok(pkg.engines.node.includes("20"));
});

test("CLI source uses the expected BlazerRouter API routes", async () => {
  const source = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
  assert.match(source, /\/v1\/models/);
  assert.match(source, /\/v1\/chat\/completions/);
});
