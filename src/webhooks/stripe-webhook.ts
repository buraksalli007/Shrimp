/**
 * Stripe webhook handler for subscription events.
 * Configure STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY in production.
 * Webhook URL: https://www.shrimpbridge.com/webhooks/stripe
 */
import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  getUserByStripeCustomerId,
  updateUserTier,
} from "../services/auth-service.js";

function verifyStripeSignature(req: Request, payload: string, secret: string): boolean {
  try {
    const crypto = require("crypto");
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) return false;
    const elements = signature.split(",");
    const timestamp = elements.find((e) => e.startsWith("t="))?.slice(2);
    const v1 = elements.find((e) => e.startsWith("v1="))?.slice(3);
    if (!timestamp || !v1) return false;
    const signed = `${timestamp}.${payload}`;
    const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function tierFromPriceId(priceId: string): string {
  const env = getEnv();
  if (priceId === env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === env.STRIPE_PRO_PRICE_ID) return "pro";
  return "free";
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn("Stripe webhook: STRIPE_WEBHOOK_SECRET not configured");
      res.status(501).json({ error: "Stripe not configured" });
      return;
    }

    const rawBody =
      (req as { body: Buffer }).body instanceof Buffer
        ? (req as { body: Buffer }).body.toString("utf8")
        : JSON.stringify(req.body);
    if (!verifyStripeSignature(req, rawBody, secret)) {
      logger.warn("Stripe webhook: invalid signature");
      res.status(401).send();
      return;
    }

    const event = (typeof rawBody === "string" ? JSON.parse(rawBody) : req.body) as {
      type?: string;
      data?: {
        object?: {
          customer?: string;
          subscription?: string;
          items?: { data?: Array<{ price?: { id?: string } }> };
          status?: string;
        };
      };
    };
    logger.info("Stripe webhook", { type: event.type });

    const obj = event.data?.object as Record<string, unknown> | undefined;
    const customerId = obj?.customer as string | undefined;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const items = (obj as { items?: { data?: Array<{ price?: { id?: string } }> } })?.items?.data;
        const priceId = items?.[0]?.price?.id;
        if (customerId && priceId) {
          const user = await getUserByStripeCustomerId(customerId);
          if (user) {
            const tier = tierFromPriceId(priceId);
            await updateUserTier(user.id, tier);
            logger.info("User tier updated", { userId: user.id, tier });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        if (customerId) {
          const user = await getUserByStripeCustomerId(customerId);
          if (user) {
            await updateUserTier(user.id, "free");
            logger.info("User tier downgraded to free", { userId: user.id });
          }
        }
        break;
      }
      case "checkout.session.completed": {
        const session = obj as { customer?: string; metadata?: { userId?: string } };
        const custId = session?.customer ?? customerId;
        if (custId && session?.metadata?.userId) {
          const { setStripeCustomerId } = await import("../services/auth-service.js");
          await setStripeCustomerId(session.metadata.userId, custId);
        }
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
}

export function registerStripeWebhook(app: import("express").Express): void {
  // Stripe webhook is registered in app.ts with express.raw() - no-op here for backwards compat
}
