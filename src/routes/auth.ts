import { Request, Response } from "express";
import {
  createUser,
  validateUser,
  createApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
} from "../services/auth-service.js";

export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    const emailTrim = email.trim().toLowerCase();
    if (emailTrim.length < 3 || password.length < 8) {
      res.status(400).json({ error: "Email invalid or password must be at least 8 characters" });
      return;
    }
    const user = await createUser({ email: emailTrim, password });
    const apiKey = await createApiKey(user.id);
    res.status(201).json({
      id: user.id,
      email: user.email,
      apiKey,
      message: "Save your API key – it will not be shown again",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    if (msg.includes("Unique constraint") || msg.includes("duplicate")) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    res.status(500).json({ error: msg });
  }
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    const user = await validateUser({ email: email.trim().toLowerCase(), password });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const apiKey = await createApiKey(user.id, "login-session");
    res.json({
      id: user.id,
      email: user.email,
      tier: user.tier,
      apiKey,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Login failed",
    });
  }
}

export async function handleMe(req: Request, res: Response): Promise<void> {
  const auth = (req as { auth?: { userId: string; email: string; tier: string } }).auth;
  if (!auth) {
    res.status(401).json({ error: "API key required. Use Authorization: Bearer YOUR_API_KEY" });
    return;
  }
  res.json({ userId: auth.userId, email: auth.email, tier: auth.tier });
}

export async function handleCreateApiKey(req: Request, res: Response): Promise<void> {
  const auth = (req as { auth?: { userId: string } }).auth;
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { name } = (req.body as { name?: string }) ?? {};
    const apiKey = await createApiKey(auth.userId, typeof name === "string" ? name : "default");
    res.status(201).json({
      apiKey,
      message: "Save your API key – it will not be shown again",
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create API key",
    });
  }
}

export async function handleListApiKeys(req: Request, res: Response): Promise<void> {
  const auth = (req as { auth?: { userId: string } }).auth;
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const keys = await listApiKeys(auth.userId);
    res.json({ keys });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to list API keys",
    });
  }
}

export async function handleRevokeApiKey(req: Request, res: Response): Promise<void> {
  const auth = (req as { auth?: { userId: string } }).auth;
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { keyId } = req.params;
  if (!keyId) {
    res.status(400).json({ error: "keyId required" });
    return;
  }
  const ok = await revokeApiKey(auth.userId, keyId);
  if (!ok) {
    res.status(404).json({ error: "API key not found" });
    return;
  }
  res.json({ success: true });
}
