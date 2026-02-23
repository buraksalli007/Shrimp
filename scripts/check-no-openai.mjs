#!/usr/bin/env node
/**
 * Ensures we never use the openai SDK (causes Vercel build errors).
 * Uses native fetch instead.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.dependencies?.openai || pkg.devDependencies?.openai) {
  console.error("ERROR: openai package must not be used. Use native fetch instead.");
  process.exit(1);
}

const apiFile = readFileSync(join(root, "src/api/openai-api.ts"), "utf8");
const bad = ["new OpenAI", 'from "openai"', "from 'openai'"];
for (const b of bad) {
  if (apiFile.includes(b)) {
    console.error(`ERROR: openai-api.ts must use fetch, not OpenAI SDK. Found: ${b}`);
    process.exit(1);
  }
}

console.log("OK: No openai SDK usage");
