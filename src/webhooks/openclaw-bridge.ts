import { sendToOpenClaw } from "../api/openclaw-api.js";

const PLAN_PROMPT = `Research this app idea (with Brave Search), plan in detail, and produce a JSON task list.
Each task: { "id": "task_1", "title": "Title", "description": "Description", "prompt": "Instruction for Cursor agent" }.
The prompt field will be used for Expo/React Native development; keep it clear and actionable.
Return only a JSON array, no other text.`;

export async function requestPlanFromOpenClaw(idea: string): Promise<void> {
  await sendToOpenClaw({
    message: `${PLAN_PROMPT}\n\nIdea: ${idea}`,
    name: "Orchestrator",
    timeoutSeconds: 180,
  });
}
