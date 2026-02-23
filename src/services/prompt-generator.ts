import { generateFixPromptWithLLM } from "../api/openai-api.js";

export async function generateFixPrompt(
  errors: string[],
  taskContext: string,
  codebaseContext?: string
): Promise<string> {
  return generateFixPromptWithLLM(errors, taskContext, codebaseContext);
}
