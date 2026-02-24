import type { MemoryQuery, MemoryRecordType, ProjectMemorySummary } from "./types.js";
import { logger } from "../utils/logger.js";

export interface MemoryRecordInput {
  projectId: string;
  type: MemoryRecordType;
  payload: Record<string, unknown>;
}

export interface IMemoryStore {
  write(record: MemoryRecordInput): Promise<void>;
  query(query: MemoryQuery): Promise<MemoryRecordInput[]>;
  getProjectSummary(projectId: string): Promise<ProjectMemorySummary>;
}

function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}

async function getPrisma() {
  if (!hasDb()) return null;
  try {
    const { prisma } = await import("../lib/db.js");
    return prisma;
  } catch {
    return null;
  }
}

export async function writeMemory(record: MemoryRecordInput): Promise<void> {
  const prisma = await getPrisma();
  if (!prisma) return;
  try {
    await prisma.memoryRecord.create({
      data: {
        projectId: record.projectId,
        type: record.type,
        payload: record.payload as object,
      },
    });
    logger.info("Memory written", { projectId: record.projectId, type: record.type });
  } catch (err) {
    logger.warn("Memory write failed (DB may be unavailable)", {
      projectId: record.projectId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function queryMemory(query: MemoryQuery): Promise<MemoryRecordInput[]> {
  const prisma = await getPrisma();
  if (!prisma) return [];
  try {

    const where: { projectId: string; type?: { in: string[] }; createdAt?: { gte: Date } } = {
      projectId: query.projectId,
    };
    if (query.types?.length) where.type = { in: query.types };
    if (query.since) where.createdAt = { gte: query.since };

    const records = await prisma.memoryRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 100,
    });

    return records.map((r) => ({
      projectId: r.projectId,
      type: r.type as MemoryRecordType,
      payload: r.payload as Record<string, unknown>,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    logger.warn("Memory query failed", {
      projectId: query.projectId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function getProjectSummary(projectId: string): Promise<ProjectMemorySummary> {
  const records = await queryMemory({ projectId, limit: 200 });

  const architectureDecisions: string[] = [];
  const failedFixPatterns: string[] = [];
  const lastPrompts: string[] = [];
  const tradeoffs: string[] = [];

  for (const r of records) {
    const p = r.payload as Record<string, unknown>;
    switch (r.type) {
      case "architectural_decision":
        if (typeof p.decision === "string") architectureDecisions.push(p.decision);
        break;
      case "failed_fix":
        if (typeof p.errorOutput === "string") failedFixPatterns.push(p.errorOutput.slice(0, 200));
        break;
      case "prompt":
        if (typeof p.promptText === "string") lastPrompts.push(p.promptText.slice(0, 150));
        break;
      case "tradeoff":
        if (typeof p.tradeoff === "string") tradeoffs.push(p.tradeoff);
        break;
      default:
        break;
    }
  }

  return {
    projectId,
    architectureDecisions: [...new Set(architectureDecisions)].slice(0, 20),
    failedFixPatterns: [...new Set(failedFixPatterns)].slice(0, 10),
    lastPrompts: lastPrompts.slice(0, 10),
    tradeoffs: [...new Set(tradeoffs)].slice(0, 10),
  };
}
