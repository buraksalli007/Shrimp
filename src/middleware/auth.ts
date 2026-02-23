import { Request, Response, NextFunction } from "express";
import { getEnv } from "../config/env.js";

const VALID_KEYS = new Set<string>();

function loadApiKeys(): Set<string> {
  const keys = getEnv().API_KEYS;
  if (!keys) return new Set();
  return new Set(keys.split(",").map((k) => k.trim()).filter(Boolean));
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const validKeys = loadApiKeys();
  if (validKeys.size === 0) {
    next();
    return;
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({
      error: "API key required",
      message: "Include Authorization: Bearer YOUR_API_KEY",
    });
    return;
  }

  const key = auth.slice(7).trim();
  if (!validKeys.has(key)) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  (req as { apiKey?: string }).apiKey = key;
  next();
}
