import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRO_PRICE_ID) {
    res.status(501).json({ error: "Stripe not configured" });
    return;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const { priceId, successUrl, cancelUrl } = req.body as {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const price = priceId ?? env.STRIPE_PRO_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl ?? "https://www.shrimpbridge.com/dashboard?success=1",
      cancel_url: cancelUrl ?? "https://www.shrimpbridge.com?canceled=1",
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error("Checkout failed", { error: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      error: err instanceof Error ? err.message : "Checkout failed",
    });
  }
}
