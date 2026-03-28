import type { Request, Response } from "express";
import { stripe } from "../services/stripeService.js";
import { UserSubscriptionModel } from "../models/UserSubscriptionModel.js";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing stripe-signature header");
  }

  const body = req.body as Buffer;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const metadata = session.metadata;

        if (metadata?.userId && metadata?.planId) {
          const plan = await import("../models/PlanModel.js").then((m) =>
            m.PlanModel.findById(metadata.planId)
          );

          if (plan) {
            const isOneTime = plan.period === "one-time";
            await UserSubscriptionModel.create({
              userId: metadata.userId,
              planId: metadata.planId,
              planName: metadata.planName || plan.name,
              stripePaymentIntentId: session.payment_intent,
              stripeSubscriptionId: session.subscription || undefined,
              stripeCustomerId: session.customer,
              status: isOneTime ? "completed" : "active",
              startDate: new Date(),
              endDate:
                plan.period === "monthly"
                  ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  : plan.period === "yearly"
                    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    : undefined,
              amountPaid: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
              period: plan.period,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await UserSubscriptionModel.updateOne(
          { stripeSubscriptionId: subscription.id },
          {
            status:
              subscription.status === "active"
                ? "active"
                : subscription.status === "canceled"
                  ? "canceled"
                  : "expired",
            endDate: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined,
          }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
