import crypto from "crypto";

const HASH_ALG = "sha256";

function hasDb(): boolean {
  if (process.env.DATABASE_URL === "skip") return false;
  return true;
}

async function getPrisma() {
  if (!hasDb()) return null;
  try {
    const { prisma: p } = await import("../lib/db.js");
    return p;
  } catch {
    return null;
  }
}

function hashApiKey(key: string): string {
  return crypto.createHash(HASH_ALG).update(key).digest("hex");
}

function generateApiKey(): string {
  const prefix = "sb_";
  const random = crypto.randomBytes(24).toString("base64url");
  return `${prefix}${random}`;
}

export async function createUser(params: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const p = await getPrisma();
  if (!p) throw new Error("Database not configured");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(params.password, 10);
  const user = await p.user.create({
    data: {
      email: params.email,
      passwordHash,
      tier: "free",
    },
  });
  return { id: user.id, email: user.email };
}

export async function validateUser(params: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string; tier: string } | null> {
  const p = await getPrisma();
  if (!p) return null;
  const user = await p.user.findUnique({
    where: { email: params.email },
  });
  if (!user?.passwordHash) return null;
  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(params.password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, tier: user.tier };
}

export async function createApiKey(userId: string, name = "default"): Promise<string> {
  const p = await getPrisma();
  if (!p) throw new Error("Database not configured");
  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  await p.apiKey.create({
    data: {
      userId,
      keyHash,
      name,
      tier: "starter",
    },
  });
  return key;
}

export async function validateApiKey(plainKey: string): Promise<{
  userId: string;
  apiKeyId: string;
  tier: string;
  email: string;
} | null> {
  const p = await getPrisma();
  if (!p) return null;
  const keyHash = hashApiKey(plainKey);
  const apiKey = await p.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });
  if (!apiKey) return null;
  return {
    userId: apiKey.userId,
    apiKeyId: apiKey.id,
    tier: apiKey.user.tier,
    email: apiKey.user.email,
  };
}

export async function listApiKeys(userId: string): Promise<Array<{ id: string; name: string; createdAt: string }>> {
  const p = await getPrisma();
  if (!p) return [];
  const keys = await p.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    createdAt: k.createdAt.toISOString(),
  }));
}

export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  const p = await getPrisma();
  if (!p) return false;
  const deleted = await p.apiKey.deleteMany({
    where: { id: keyId, userId },
  });
  return deleted.count > 0;
}

export async function updateUserTier(userId: string, tier: string): Promise<void> {
  const p = await getPrisma();
  if (!p) return;
  await p.user.update({
    where: { id: userId },
    data: { tier },
  });
}

export async function setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
  const p = await getPrisma();
  if (!p) return;
  await p.user.update({
    where: { id: userId },
    data: { stripeCustomerId },
  });
}

export async function getUserByStripeCustomerId(stripeCustomerId: string): Promise<{ id: string } | null> {
  const p = await getPrisma();
  if (!p) return null;
  const user = await p.user.findFirst({
    where: { stripeCustomerId },
  });
  return user ? { id: user.id } : null;
}
