import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { getEnv } from "../config/env.js";

export function securityMiddleware() {
  const env = getEnv();
  const isProd = env.NODE_ENV === "production";

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 100 : 1000,
    message: { error: "Too many requests, try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const helmetConfig = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  return { limiter, helmet: helmetConfig };
}
