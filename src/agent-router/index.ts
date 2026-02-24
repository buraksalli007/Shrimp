import { registerAgent } from "./agent-registry.js";
import { CursorCodingAgent, setCursorConfig } from "./adapters/cursor-adapter.js";
import { OpenClawPlanningAgent, OpenClawResearchAgent, setOpenClawConfig } from "./adapters/openclaw-adapter.js";

registerAgent(CursorCodingAgent);
registerAgent(OpenClawPlanningAgent);
registerAgent(OpenClawResearchAgent);

export { getAgent, registerAgent, getRegisteredCapabilities } from "./agent-registry.js";
export { setCursorConfig, getCursorConfig } from "./adapters/cursor-adapter.js";
export { setOpenClawConfig, getOpenClawConfig } from "./adapters/openclaw-adapter.js";
export type { IAgent, AgentRequest, AgentResponse, AgentCapability, AgentContext } from "./agent-interface.js";
