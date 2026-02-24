import type { FailureCategory } from "./types.js";

const DEPENDENCY_PATTERNS = [
  /cannot find module/i,
  /module not found/i,
  /npm err/i,
  /package\.json/i,
  /install/i,
  /dependency/i,
  /peer dep/i,
  /E404/i,
];

const SYNTAX_PATTERNS = [
  /unexpected token/i,
  /syntax error/i,
  /parsing error/i,
  /expected/i,
  /TS\d{4}/i,
  /TypeError/i,
  /ReferenceError/i,
];

const ARCHITECTURE_PATTERNS = [
  /circular/i,
  /import.*from/i,
  /export/i,
  /component.*not found/i,
  /hook.*rules/i,
  /invalid hook/i,
];

const ENVIRONMENT_PATTERNS = [
  /ENOENT/i,
  /EACCES/i,
  /permission denied/i,
  /port.*in use/i,
  /timeout/i,
  /network/i,
  /expo.*config/i,
  /app\.json/i,
];

export function classifyFailure(
  errors: string[],
  stderr?: string
): FailureCategory {
  const combined = [...errors, stderr ?? ""].join("\n").toLowerCase();

  for (const p of DEPENDENCY_PATTERNS) {
    if (p.test(combined)) return "dependency";
  }
  for (const p of SYNTAX_PATTERNS) {
    if (p.test(combined)) return "syntax";
  }
  for (const p of ARCHITECTURE_PATTERNS) {
    if (p.test(combined)) return "architecture";
  }
  for (const p of ENVIRONMENT_PATTERNS) {
    if (p.test(combined)) return "environment";
  }

  return "unknown";
}
