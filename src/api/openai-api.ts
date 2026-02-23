import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function generateFixPromptWithLLM(
  errors: string[],
  taskContext: string,
  codebaseContext?: string
): Promise<string> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return buildStaticFixPrompt(errors, taskContext, codebaseContext);
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const systemPrompt = `Sen bir senior React Native / Expo geliştiricisisin. Görev: Verilen hataları düzeltmek için Cursor agent'a verilecek kısa, net bir prompt üret. Sadece düzeltme talimatı yaz, başka açıklama ekleme.`;

    const userPrompt = `Görev bağlamı: ${taskContext}

Tespit edilen hatalar:
${errors.join("\n")}
${codebaseContext ? `\nİlgili kod/çıktı:\n${codebaseContext}` : ""}

Bu hataları düzeltecek Cursor agent prompt'unu yaz (Türkçe veya İngilizce, maksimum 300 kelime):`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
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
  return `Sen bir senior React Native geliştiricisisin. Görev: ${taskContext}

Aşağıdaki hatalar tespit edildi. Her birini düzelt. Sadece düzeltme yap, başka değişiklik yapma.

Hatalar:
${errors.join("\n")}
${codebaseContext ? `\nİlgili kod:\n${codebaseContext}` : ""}`;
}
