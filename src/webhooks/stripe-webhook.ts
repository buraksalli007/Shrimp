/**
 * Stripe webhook handler for subscription events.
 * Configure STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY in production.
 * Webhook URL: https://www.shrimpbridge.com/webhooks/stripe
 */
import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

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

export function registerStripeWebhook(app: import("express").Express): void {
  app.post("/webhooks/stripe", async (req: Request, res: Response) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn("Stripe webhook: STRIPE_WEBHOOK_SECRET not configured");
      res.status(501).json({ error: "Stripe not configured" });
      return;
    }

    const rawBody =
      (req as unknown as { rawBody?: Buffer }).rawBody?.toString() ?? JSON.stringify(req.body);
    if (!verifyStripeSignature(req, rawBody, secret)) {
      logger.warn("Stripe webhook: invalid signature");
      res.status(401).send();
      return;
    }

    const event = req.body as { type?: string; data?: { object?: unknown } };
    logger.info("Stripe webhook", { type: event.type });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        break;
      case "customer.subscription.deleted":
        break;
      case "invoice.paid":
        break;
      case "invoice.payment_failed":
        break;
      default:
        break;
    }

    res.status(200).json({ received: true });
  });
}
