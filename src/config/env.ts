import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  CURSOR_API_KEY: z.string().optional(),
  CURSOR_WEBHOOK_SECRET: z.string().optional(),
  OPENCLAW_GATEWAY_URL: z.string().default("http://127.0.0.1:18789"),
  OPENCLAW_HOOKS_TOKEN: z.string().optional(),
  OPENCLAW_AGENT_ID: z.string().default("main"),
  ORCHESTRATION_URL: z.string().default("http://localhost:3000"),
  GITHUB_REPO_OWNER: z.string().optional(),
  GITHUB_REPO_NAME: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  MAX_ITERATIONS: z.coerce.number().default(10),
  VERIFICATION_TIMEOUT_MS: z.coerce.number().default(120_000),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment: ${issues.join("; ")}`);
  }
    _env = result.data;
  }
  return _env;
}
