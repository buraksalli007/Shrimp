# Shrimp Bridge – Architecture v2: AI Development Orchestration Brain

## Vision Shift

**From:** Automation pipeline (idea → plan → code → validate → fix → deploy)  
**To:** AI Development Orchestration Brain – manages decisions, memory, and autonomous execution.

Agents (Cursor, OpenClaw, future providers) are **pluggable**. The brain is agent-agnostic.

---

## 1. Updated Architecture Proposal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR CORE (Brain)                              │
│  - Session management                                                        │
│  - Mode routing (Assist / Builder / Autopilot)                               │
│  - Outcome orchestration                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌───────────────────┐
│ DECISION      │           │ MEMORY STORE    │           │ AGENT ROUTER      │
│ ENGINE        │◄─────────►│                 │◄─────────►│                   │
│               │           │ - Architecture  │           │ - Cursor          │
│ - Scope gate  │           │ - Failures      │           │ - OpenClaw        │
│ - MVP logic   │           │ - Prompts       │           │ - [Future agents] │
│ - Complexity  │           │ - Tradeoffs     │           │                   │
└───────────────┘           └─────────────────┘           └───────────────────┘
        │                             │                             │
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌───────────────────┐
│ VALIDATION    │           │ FAILURE          │           │ DEPLOYMENT        │
│ ENGINE        │◄─────────►│ RECOVERY         │           │ MANAGER           │
│               │           │                   │           │                   │
│ - Build       │           │ - Classify        │           │ - EAS             │
│ - Lint/Test   │           │ - Root cause      │           │ - App Store      │
│ - Expo doctor │           │ - Retry strategy  │           │ - [Future]        │
└───────────────┘           └─────────────────┘           └───────────────────┘
```

---

## 2. Suggested Folder Structure

```
src/
├── core/                          # Orchestrator Core
│   ├── orchestrator.ts            # Main brain: session, mode, flow
│   ├── session-manager.ts         # Project session lifecycle
│   └── mode-router.ts             # Assist / Builder / Autopilot routing
│
├── decision-engine/               # Decision Engine
│   ├── index.ts
│   ├── scope-gate.ts             # Prevent scope explosion
│   ├── mvp-evaluator.ts           # MVP-first logic
│   ├── complexity-scorer.ts      # Complexity vs value
│   ├── reasoning-logger.ts       # Decision reasoning logs
│   └── types.ts
│
├── memory/                        # Persistent Project Memory
│   ├── index.ts
│   ├── memory-store.ts           # CRUD, query interface
│   ├── schemas/                  # Memory record types
│   │   ├── architectural-decision.ts
│   │   ├── failed-fix.ts
│   │   ├── implementation-history.ts
│   │   └── prompt-record.ts
│   └── adapters/
│       └── prisma-memory-adapter.ts
│
├── agent-router/                  # Agent Router (pluggable)
│   ├── index.ts
│   ├── agent-registry.ts         # Register agents by capability
│   ├── adapters/
│   │   ├── cursor-adapter.ts
│   │   ├── openclaw-adapter.ts
│   │   └── agent-interface.ts    # Common interface
│   └── capability-map.ts         # planning | coding | research | deploy
│
├── validation-engine/             # Validation Engine
│   ├── index.ts
│   ├── verifier.ts              # Build, lint, test
│   └── result-parser.ts         # Extract errors for recovery
│
├── failure-recovery/             # Intelligent Failure Recovery
│   ├── index.ts
│   ├── failure-classifier.ts    # dependency | syntax | architecture | env
│   ├── root-cause-analyzer.ts
│   ├── retry-strategy.ts        # Targeted retry, max attempts
│   └── types.ts
│
├── outcome-workflow/             # Outcome-Oriented Workflow
│   ├── index.ts
│   ├── outcome-generator.ts     # MVP list, risks, monetization, phases
│   ├── risk-analyzer.ts
│   └── phase-estimator.ts
│
├── deployment-manager/           # Deployment Manager
│   ├── index.ts
│   └── eas-controller.ts        # (existing, refactored)
│
├── webhooks/                     # (existing, extended)
├── api/                          # (existing)
└── config/
```

---

## 3. Core Service Interfaces

### 3.1 Decision Engine

```typescript
// decision-engine/types.ts

export type DecisionOutcome = "approve" | "postpone" | "reject";

export interface DecisionInput {
  idea: string;
  proposedTasks: Task[];
  projectMemory?: ProjectMemorySummary;
  mode: AutonomyMode;
}

export interface DecisionResult {
  outcome: DecisionOutcome;
  approvedTasks: Task[];
  postponedTasks: Task[];
  rejectedReasons: string[];
  reasoningLog: ReasoningEntry[];
  scopeScore: number;      // 0-1, lower = tighter scope
  complexityScore: number; // 0-1
}

export interface ReasoningEntry {
  timestamp: string;
  rule: string;
  input: unknown;
  output: string;
  confidence: number;
}

export interface IDecisionEngine {
  evaluate(input: DecisionInput): Promise<DecisionResult>;
}
```

### 3.2 Memory Store

```typescript
// memory/memory-store.ts

export interface MemoryQuery {
  projectId: string;
  types?: MemoryRecordType[];
  since?: Date;
  limit?: number;
}

export type MemoryRecordType =
  | "architectural_decision"
  | "failed_fix"
  | "implementation"
  | "prompt"
  | "tradeoff";

export interface IMemoryStore {
  write(record: MemoryRecord): Promise<void>;
  query(query: MemoryQuery): Promise<MemoryRecord[]>;
  getProjectSummary(projectId: string): Promise<ProjectMemorySummary>;
}

export interface ProjectMemorySummary {
  projectId: string;
  architectureDecisions: string[];
  failedFixPatterns: string[];
  lastPrompts: string[];
  tradeoffs: string[];
}
```

### 3.3 Agent Router

```typescript
// agent-router/agent-interface.ts

export type AgentCapability = "planning" | "coding" | "research" | "deploy";

export interface AgentRequest {
  capability: AgentCapability;
  prompt: string;
  context: AgentContext;
  projectId: string;
}

export interface AgentContext {
  memorySummary?: ProjectMemorySummary;
  previousFailures?: string[];
  mode: AutonomyMode;
}

export interface AgentResponse {
  success: boolean;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface IAgent {
  readonly capability: AgentCapability;
  execute(request: AgentRequest): Promise<AgentResponse>;
}
```

### 3.4 Failure Recovery

```typescript
// failure-recovery/types.ts

export type FailureCategory =
  | "dependency"
  | "syntax"
  | "architecture"
  | "environment"
  | "unknown";

export interface FailureAnalysis {
  category: FailureCategory;
  rootCauseHint: string;
  retryStrategy: RetryStrategy;
  suggestedPrompt?: string;
  shouldEscalate: boolean;  // true = needs human / different approach
}

export interface RetryStrategy {
  action: "retry" | "escalate" | "abort";
  maxAttempts: number;
  attemptNumber: number;
  modifiedPrompt?: string;
}
```

### 3.5 Autonomy Modes

```typescript
// core/mode-router.ts

export type AutonomyMode = "assist" | "builder" | "autopilot";

export interface ModeBehavior {
  planning: "suggest" | "execute" | "execute";
  coding: "suggest" | "execute_approval" | "execute";
  deployment: "suggest" | "approval_required" | "auto";
  decisionStrictness: "lenient" | "moderate" | "strict";
}
```

---

## 4. Example Data Structures for Memory

### 4.1 Architectural Decision

```typescript
{
  type: "architectural_decision",
  projectId: "proj_xxx",
  timestamp: "2026-02-24T12:00:00Z",
  decision: "Use Expo Router for navigation instead of React Navigation stack",
  rationale: "Expo Router provides file-based routing, better DX",
  alternativesConsidered: ["React Navigation", "React Router Native"],
  impact: "Affects all screen components"
}
```

### 4.2 Failed Fix

```typescript
{
  type: "failed_fix",
  projectId: "proj_xxx",
  timestamp: "2026-02-24T12:05:00Z",
  taskId: "task_2",
  promptUsed: "Fix the TypeScript error in App.tsx...",
  errorOutput: "TS2307: Cannot find module 'expo-router'",
  category: "dependency",
  attemptNumber: 2
}
```

### 4.3 Implementation History

```typescript
{
  type: "implementation",
  projectId: "proj_xxx",
  timestamp: "2026-02-24T12:10:00Z",
  taskId: "task_1",
  promptUsed: "Create home screen with...",
  filesChanged: ["src/screens/Home.tsx", "src/navigation/index.tsx"],
  verificationPassed: true,
  agentId: "cursor_agent_xxx"
}
```

### 4.4 Prompt Record

```typescript
{
  type: "prompt",
  projectId: "proj_xxx",
  timestamp: "2026-02-24T12:00:00Z",
  capability: "planning",
  promptText: "Research fitness tracker apps...",
  responseSummary: "Generated 5 tasks for MVP",
  agentUsed: "openclaw"
}
```

### 4.5 Tradeoff

```typescript
{
  type: "tradeoff",
  projectId: "proj_xxx",
  timestamp: "2026-02-24T12:15:00Z",
  tradeoff: "Chose SQLite over AsyncStorage for workout history",
  reason: "Need query support for analytics",
  downside: "Larger bundle, migration complexity"
}
```

---

## 5. Execution Flow Diagram (Text-Based)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    USER INPUT                             │
                    │              "Fitness tracker app"                         │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              OUTCOME WORKFLOW                            │
                    │  - Generate MVP feature list                            │
                    │  - Risk analysis                                         │
                    │  - Monetization suggestions                              │
                    │  - Recommended architecture                              │
                    │  - Phase estimates                                       │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 MEMORY STORE                             │
                    │  - Load project memory (if exists)                        │
                    │  - Pass summary to Decision Engine                       │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │               DECISION ENGINE                            │
                    │  - Scope gate: prevent explosion                         │
                    │  - MVP evaluator: approve/postpone/reject                │
                    │  - Complexity scorer                                     │
                    │  - Output: approved tasks + reasoning log                │
                    └─────────────────────────────────────────────────────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
                    REJECT              POSTPONE               APPROVE
                    (reasoning log)     (defer to later)        (continue)
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 MODE ROUTER                              │
                    │  Assist: suggest only → stop                             │
                    │  Builder: execute + approval gates                        │
                    │  Autopilot: execute end-to-end                           │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 AGENT ROUTER                             │
                    │  - Select agent by capability (planning → OpenClaw)     │
                    │  - Inject memory summary into context                    │
                    │  - Execute planning task                                 │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 AGENT ROUTER                             │
                    │  - Select agent (coding → Cursor)                        │
                    │  - Execute coding task                                   │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │               VALIDATION ENGINE                          │
                    │  - Build, lint, test, expo-doctor                         │
                    └─────────────────────────────────────────────────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         │                                         │
                         ▼                                         ▼
                    SUCCESS                                    FAILURE
                         │                                         │
                         │                                         ▼
                         │                    ┌─────────────────────────────────┐
                         │                    │       FAILURE RECOVERY           │
                         │                    │  - Classify (dep/syntax/arch/env)│
                         │                    │  - Root cause                     │
                         │                    │  - Retry strategy                 │
                         │                    │  - Write to memory (failed_fix)   │
                         │                    └─────────────────────────────────┘
                         │                                         │
                         │                    ┌────────────────────┴────────────┐
                         │                    │                                 │
                         │                    ▼                                 ▼
                         │               RETRY (bounded)                   ESCALATE
                         │                    │                                 │
                         │                    └─────────────┬─────────────────┘
                         │                                    │
                         ▼                                    ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 MEMORY STORE                              │
                    │  - Write implementation / failed_fix                      │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │  More tasks? → loop to Agent Router                        │
                    │  All done? → Mode check → Approval gate or Auto deploy   │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │               DEPLOYMENT MANAGER                         │
                    │  - EAS build, App Store submit                           │
                    └─────────────────────────────────────────────────────────┘
```

---

## 6. MVP Implementation Order

| Phase | Component | Effort | Dependencies |
|-------|-----------|--------|--------------|
| **1** | Memory Store (schema + Prisma) | 2–3 days | None |
| **2** | Memory write/query API | 1 day | Phase 1 |
| **3** | Decision Engine (scope gate, MVP evaluator) | 2–3 days | Memory summary |
| **4** | Reasoning logger | 0.5 day | Phase 3 |
| **5** | Failure classifier + retry strategy | 2 days | Validation output |
| **6** | Autonomy modes (mode router) | 1–2 days | Core flow |
| **7** | Outcome workflow (MVP list, phases) | 2 days | None |
| **8** | Agent Router (interface + adapters) | 2 days | Existing Cursor/OpenClaw |
| **9** | Orchestrator Core (wire all) | 2–3 days | All above |

**Recommended start:** Phase 1 (Memory) → Phase 3 (Decision Engine) → Phase 5 (Failure Recovery).

---

## 7. Agent Independence

Agents are identified by **capability**, not by name:

| Capability | Current Agent | Replaceable With |
|------------|---------------|------------------|
| planning | OpenClaw | Any LLM + search |
| coding | Cursor | Claude, GPT, Codeium, etc. |
| research | OpenClaw | Perplexity, custom RAG |
| deploy | EAS | Fastlane, custom CI |

The **Agent Router** resolves capability → agent via a registry. Adding a new agent = implementing `IAgent` and registering.

---

## 8. Scalability Notes

- **Memory:** Pagination, TTL for old records, indexing by `projectId` + `type` + `timestamp`
- **Decision Engine:** Stateless, cacheable for same input
- **Failure Recovery:** Per-project retry counters, global max attempts
- **Orchestrator:** Queue-based for high concurrency (e.g. Bull/BullMQ)

---

## 9. Appendix: Prisma Schema for Memory (Phase 1)

```prisma
model MemoryRecord {
  id          String   @id @default(cuid())
  projectId   String
  type        String   // architectural_decision | failed_fix | implementation | prompt | tradeoff
  payload     Json     // type-specific data
  createdAt   DateTime @default(now())

  @@index([projectId, type])
  @@index([projectId, createdAt])
}
```
