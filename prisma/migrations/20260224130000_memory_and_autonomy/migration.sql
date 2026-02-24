-- AlterTable
ALTER TABLE "Project" ADD COLUMN "autonomyMode" TEXT NOT NULL DEFAULT 'builder';
ALTER TABLE "Project" ADD COLUMN "outcomeJson" TEXT;

-- CreateTable
CREATE TABLE "MemoryRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryRecord_projectId_type_idx" ON "MemoryRecord"("projectId", "type");
CREATE INDEX "MemoryRecord_projectId_createdAt_idx" ON "MemoryRecord"("projectId", "createdAt");
