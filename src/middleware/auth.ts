import { Request, Response, NextFunction } from "express";
import { getEnv } from "../config/env.js";
import { validateApiKey } from "../services/auth-service.js";

function loadEnvApiKeys(): Set<string> {
  const keys = getEnv().API_KEYS;
  if (!keys) return new Set();
  return new Set(keys.split(",").map((k) => k.trim()).filter(Boolean));
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
  const envKeys = loadEnvApiKeys();
  const auth = req.headers.authorization;
  const key = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;

  if (!key) {
    res.status(401).json({
      error: "API key required",
      message: "Include Authorization: Bearer YOUR_API_KEY",
    });
    return;
  }

  if (envKeys.size > 0 && envKeys.has(key)) {
    (req as { apiKey?: string }).apiKey = key;
    next();
    return;
  }

  const dbAuth = await validateApiKey(key);
  if (dbAuth) {
    (req as { apiKey?: string }).apiKey = key;
    (req as { auth?: { userId: string; apiKeyId: string; tier: string; email: string } }).auth = {
      userId: dbAuth.userId,
      apiKeyId: dbAuth.apiKeyId,
      tier: dbAuth.tier,
      email: dbAuth.email,
    };
    next();
    return;
  }

  res.status(401).json({ error: "Invalid API key" });
  return;
  })().catch(next);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as { auth?: { userId: string } }).auth;
  if (!auth?.userId) {
    res.status(401).json({
      error: "User authentication required",
      message: "Use an API key from your account. Sign up at the website to get one.",
    });
    return;
  }
  next();
}
