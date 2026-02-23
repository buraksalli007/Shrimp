import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Generate fix prompt using OpenAI API via native fetch.
 * Do NOT use the "openai" npm package - it causes Vercel build errors.
 */
export async function generateFixPrompt(
  errors: string[],
  taskContext: string,
  codebaseContext?: string
): Promise<string> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return buildStaticFixPrompt(errors, taskContext, codebaseContext);
  }

  try {
    const systemPrompt = `You are a senior React Native / Expo developer. Task: Produce a short, clear prompt for the Cursor agent to fix the given errors. Write only the fix instruction, no other explanation.`;

    const userPrompt = `Task context: ${taskContext}

Detected errors:
${errors.join("\n")}
${codebaseContext ? `\nRelevant code/output:\n${codebaseContext}` : ""}

Write the Cursor agent prompt to fix these errors (max 300 words):`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content) {
      logger.info("LLM generated fix prompt", { length: content.length });
      return content;
    }
  } catch (err) {
    logger.warn("OpenAI fix prompt generation failed, using static prompt", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return buildStaticFixPrompt(errors, taskContext, codebaseContext);
}

function buildStaticFixPrompt(
  errors: string[],
  taskContext: string,
  codebaseContext?: string
): string {
  return `You are a senior React Native developer. Task: ${taskContext}

The following errors were detected. Fix each one. Only fix, do not make other changes.

Errors:
${errors.join("\n")}
${codebaseContext ? `\nRelevant code:\n${codebaseContext}` : ""}`;
}
