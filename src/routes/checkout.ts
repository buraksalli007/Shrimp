import { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { setStripeCustomerId } from "../services/auth-service.js";

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRO_PRICE_ID) {
    res.status(501).json({ error: "Stripe not configured" });
    return;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const auth = (req as { auth?: { userId: string; email: string } }).auth;
    const { priceId, successUrl, cancelUrl } = req.body as {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const price = priceId ?? env.STRIPE_PRO_PRICE_ID;
    const sessionParams: {
      mode: "subscription";
      line_items: Array<{ price: string; quantity: number }>;
      success_url: string;
      cancel_url: string;
      metadata?: Record<string, string>;
      subscription_data?: { metadata: Record<string, string> };
      customer?: string;
    } = {
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl ?? "https://www.shrimpbridge.com/dashboard?success=1",
      cancel_url: cancelUrl ?? "https://www.shrimpbridge.com?canceled=1",
      metadata: auth?.userId ? { userId: auth.userId } : undefined,
      subscription_data: auth?.userId ? { metadata: { userId: auth.userId } } : undefined,
    };

    if (auth?.email) {
      const customers = await stripe.customers.list({ email: auth.email, limit: 1 });
      let customerId: string | undefined;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email: auth.email });
        customerId = customer.id;
        if (auth.userId) await setStripeCustomerId(auth.userId, customer.id);
      }
      if (customerId) sessionParams.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error("Checkout failed", { error: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      error: err instanceof Error ? err.message : "Checkout failed",
    });
  }
}
