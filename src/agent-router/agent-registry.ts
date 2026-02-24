import type { IAgent } from "./agent-interface.js";
import type { AgentCapability } from "./agent-interface.js";

const registry = new Map<AgentCapability, IAgent>();

export function registerAgent(agent: IAgent): void {
  registry.set(agent.capability, agent);
}

export function getAgent(capability: AgentCapability): IAgent | undefined {
  return registry.get(capability);
}

export function getRegisteredCapabilities(): AgentCapability[] {
  return Array.from(registry.keys());
}
