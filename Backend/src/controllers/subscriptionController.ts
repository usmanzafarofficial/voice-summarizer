import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PlanModel } from "../models/PlanModel.js";
import { UserSubscriptionModel } from "../models/UserSubscriptionModel.js";
import { UserUsageModel } from "../models/UserUsageModel.js";
import { stripe, createCheckoutSession } from "../services/stripeService.js";

const createCheckoutSchema = z.object({
  planId: z.string(),
});

const confirmCheckoutSchema = z.object({
  sessionId: z.string(),
});

const submitManualPaymentSchema = z.object({
  planId: z.string(),
  transactionId: z.string().min(1),
  paymentMethod: z.enum(["easypaisa", "jazzcash"]),
});

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId } = createCheckoutSchema.parse(req.body);
    const plan = await PlanModel.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (!plan.stripePriceId) {
      return res.status(400).json({ error: "Plan not configured for payment" });
    }

    const userEmail = (req as any).userEmail;
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:8080";

    // Retrieve Stripe price to determine if it's recurring or one-time
    const stripePrice = await stripe.prices.retrieve(plan.stripePriceId);
    const isSubscription = stripePrice.type === "recurring";

    const session = await createCheckoutSession({
      planId: plan._id.toString(),
      planName: plan.name,
      priceId: plan.stripePriceId,
      userId,
      userEmail,
      isSubscription,
      successUrl: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/plans?payment=canceled`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    next(err);
  }
}

export async function confirmCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { sessionId } = confirmCheckoutSchema.parse(req.body);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Checkout session not found" });
    }

    const metadata = (session.metadata || {}) as Record<string, string | undefined>;
    const metaUserId = metadata.userId;
    const planId = metadata.planId;

    if (!metaUserId || !planId) {
      return res.status(400).json({ error: "Missing metadata on checkout session" });
    }

    if (metaUserId !== userId) {
      return res.status(403).json({ error: "Session does not belong to this user" });
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const existing = await UserSubscriptionModel.findOne({
      stripePaymentIntentId: session.payment_intent ?? undefined,
    });

    if (existing) {
      return res.json(existing);
    }

    const isOneTime = !session.subscription;

    const startDate = new Date();
    const endDate =
      plan.period === "monthly"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : plan.period === "yearly"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : undefined;

    const subscriptionDoc = await UserSubscriptionModel.create({
      userId,
      planId,
      planName: metadata.planName || plan.name,
      stripePaymentIntentId: session.payment_intent ?? undefined,
      stripeSubscriptionId: (session.subscription as string | null) || undefined,
      stripeCustomerId: (session.customer as string | null) || undefined,
      status: isOneTime ? "completed" : "active",
      startDate,
      endDate,
      amountPaid: ((session.amount_total as number | null | undefined) || 0) / 100,
      currency: (session.currency as string | null | undefined) || "usd",
      period: plan.period,
    });

    // Initialize or reset usage record
    await UserUsageModel.findOneAndUpdate(
      { userId },
      {
        userId,
        period: plan.period,
        periodStart: startDate,
        periodEnd: endDate,
        voicesGenerated: 0,
        pdfDownloads: 0,
        summarizationEdits: 0,
        lastReset: startDate,
      },
      { upsert: true, new: true }
    );

    return res.json(subscriptionDoc);
  } catch (err) {
    next(err);
  }
}

export async function getUserSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscriptions = await UserSubscriptionModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
}

export async function submitManualPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId, transactionId, paymentMethod } = submitManualPaymentSchema.parse(req.body);
    const plan = await PlanModel.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Check if there is already a pending transaction with the same ID
    const existing = await UserSubscriptionModel.findOne({ transactionId });
    if (existing) {
       return res.status(400).json({ error: "This Transaction ID has already been submitted." });
    }

    const subscriptionDoc = await UserSubscriptionModel.create({
      userId,
      planId,
      planName: plan.name,
      status: "pending",
      startDate: new Date(),
      amountPaid: plan.price,
      currency: plan.currency || "usd",
      period: plan.period,
      transactionId,
      paymentMethod,
    });

    return res.json({
      message: "Payment submitted successfully. You will be upgraded after the payment verification.",
      subscription: subscriptionDoc,
    });
  } catch (err) {
    next(err);
  }
}
