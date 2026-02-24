import { sendToOpenClaw, type OpenClawCredentialsOverride } from "../api/openclaw-api.js";

const PLAN_PROMPT = `Research this app idea (with Brave Search), plan in detail, and produce a JSON task list.
Each task: { "id": "task_1", "title": "Title", "description": "Description", "prompt": "Instruction for Cursor agent" }.
The prompt field will be used for Expo/React Native development; keep it clear and actionable.
Return only a JSON array, no other text.
IMPORTANT: Include the projectId in your response. Send to Shrimp Bridge webhook: POST /webhooks/openclaw with body { "projectId": "<id>", "type": "plan", "tasks": [your json array] }`;

export async function requestPlanFromOpenClaw(
  idea: string,
  projectId: string,
  credentials?: OpenClawCredentialsOverride
): Promise<void> {
  await sendToOpenClaw(
    {
      message: `${PLAN_PROMPT}\n\nProjectId: ${projectId}\nIdea: ${idea}`,
      name: "Orchestrator",
      timeoutSeconds: 180,
    },
    credentials
  );
}

const FIX_PROMPT = `Research these build/lint errors (use Brave Search). Produce a Cursor agent prompt to fix them.
Return ONLY a JSON object: { "fixPrompt": "your detailed fix instruction for the Cursor agent" }.
No other text. The fixPrompt should be actionable for Expo/React Native.`;

export async function requestFixFromOpenClaw(
  projectId: string,
  errors: string[],
  taskContext: string,
  stderr?: string,
  credentials?: OpenClawCredentialsOverride
): Promise<void> {
  await sendToOpenClaw(
    {
      message: `${FIX_PROMPT}\n\nProjectId: ${projectId}\nTask context: ${taskContext}\n\nErrors:\n${errors.join("\n")}\n${stderr ? `\nStderr:\n${stderr.slice(-2000)}` : ""}\n\nReply via webhook: POST /webhooks/openclaw with { "projectId": "${projectId}", "type": "fix", "fixPrompt": "..." }`,
      name: "Orchestrator",
      timeoutSeconds: 120,
    },
    credentials
  );
}
