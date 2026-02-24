-- AlterTable
ALTER TABLE "User" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'free';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'cursor';

-- CreateTable
CREATE TABLE "UserCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cursorApiKeyEnc" TEXT,
    "cursorWebhookSecret" TEXT,
    "openclawToken" TEXT,
    "openclawGatewayUrl" TEXT,
    "githubTokenEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCredential_userId_key" ON "UserCredential"("userId");

-- AddForeignKey
ALTER TABLE "UserCredential" ADD CONSTRAINT "UserCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
