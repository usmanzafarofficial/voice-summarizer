import type { Request, Response, NextFunction } from "express";
import { UserUsageModel } from "../models/UserUsageModel.js";
import { UserSubscriptionModel } from "../models/UserSubscriptionModel.js";
import { PlanModel } from "../models/PlanModel.js";

export async function getUserUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get active subscription
    const subscription = await UserSubscriptionModel.findOne({
      userId,
      status: { $in: ["active", "completed"] },
    }).sort({ createdAt: -1 });

    const now = new Date();

    if (!subscription) {
      // Free tier: 20 voices, 20 PDFs, 20 summary edits
      let usage = await UserUsageModel.findOne({ userId });
      if (!usage) {
        usage = await UserUsageModel.create({
          userId,
          period: "free",
          periodStart: now,
          voicesGenerated: 0,
          pdfDownloads: 0,
          summarizationEdits: 0,
        });
      } else if (usage.period !== "free") {
        // User had subscription before, now on free tier - keep their usage counts
        usage.period = "free";
        usage.periodStart = now;
        await usage.save();
      }

      const limits = getPlanLimits(null);

      return res.json({
        usage: {
          voicesGenerated: usage.voicesGenerated,
          pdfDownloads: usage.pdfDownloads,
          summarizationEdits: usage.summarizationEdits,
        },
        limits,
        plan: {
          name: "Free",
          period: "free",
        },
        subscription: {
          status: "free",
          startDate: usage.periodStart,
          endDate: null,
        },
      });
    }

    const plan = await PlanModel.findById(subscription.planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Get or create usage record for subscribed users
    let usage = await UserUsageModel.findOne({ userId });
    if (!usage) {
      usage = await UserUsageModel.create({
        userId,
        period: plan.period,
        periodStart: subscription.startDate,
        periodEnd: subscription.endDate,
        voicesGenerated: 0,
        pdfDownloads: 0,
        summarizationEdits: 0,
      });
    } else {
      // Reset usage for monthly/yearly plans if period has changed
      if (plan.period !== "one-time" && subscription.endDate && now > subscription.endDate) {
        // Subscription expired, reset usage
        usage.voicesGenerated = 0;
        usage.pdfDownloads = 0;
        usage.summarizationEdits = 0;
        usage.periodStart = subscription.startDate;
        usage.periodEnd = subscription.endDate;
        usage.period = plan.period;
        await usage.save();
      } else if (plan.period === "monthly" && usage.lastReset) {
        // Check if we need to reset monthly usage
        const daysSinceReset = Math.floor(
          (now.getTime() - usage.lastReset.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceReset >= 30) {
          usage.voicesGenerated = 0;
          usage.pdfDownloads = 0;
          usage.summarizationEdits = 0;
          usage.lastReset = now;
          usage.periodStart = now;
          await usage.save();
        }
      }
    }

    const limits = getPlanLimits(plan);

    res.json({
      usage: {
        voicesGenerated: usage.voicesGenerated,
        pdfDownloads: usage.pdfDownloads,
        summarizationEdits: usage.summarizationEdits,
      },
      limits,
      plan: {
        name: plan.name,
        period: plan.period,
      },
      subscription: {
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function incrementUsage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { type, amount = 1 } = req.body as {
      type: "voices" | "pdfs" | "edits";
      amount?: number;
    };

    if (!["voices", "pdfs", "edits"].includes(type)) {
      return res.status(400).json({ error: "Invalid usage type" });
    }

    // Get active subscription (may be null for free tier)
    const subscription = await UserSubscriptionModel.findOne({
      userId,
      status: { $in: ["active", "completed"] },
    }).sort({ createdAt: -1 });

    const plan = subscription ? await PlanModel.findById(subscription.planId) : null;
    if (subscription && !plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Get or create usage record
    let usage = await UserUsageModel.findOne({ userId });
    if (!usage) {
      const now = new Date();
      usage = await UserUsageModel.create({
        userId,
        period: subscription ? plan?.period ?? "one-time" : "free",
        periodStart: subscription?.startDate ?? now,
        periodEnd: subscription?.endDate,
        voicesGenerated: 0,
        pdfDownloads: 0,
        summarizationEdits: 0,
      });
    } else if (!subscription && usage.period !== "free") {
      usage.period = "free";
      usage.periodStart = new Date();
      await usage.save();
    }

    // Check limits before incrementing (plan can be null for free tier)
    const limits = getPlanLimits(plan);
    let canIncrement = true;
    let currentValue = 0;

    switch (type) {
      case "voices":
        currentValue = usage.voicesGenerated;
        canIncrement = limits.voices === -1 || currentValue + amount <= limits.voices;
        if (canIncrement) {
          usage.voicesGenerated += amount;
        }
        break;
      case "pdfs":
        currentValue = usage.pdfDownloads;
        canIncrement = limits.pdfs === -1 || currentValue + amount <= limits.pdfs;
        if (canIncrement) {
          usage.pdfDownloads += amount;
        }
        break;
      case "edits":
        currentValue = usage.summarizationEdits;
        canIncrement = limits.edits === -1 || currentValue + amount <= limits.edits;
        if (canIncrement) {
          usage.summarizationEdits += amount;
        }
        break;
    }

    if (!canIncrement) {
      return res.status(403).json({
        error: `Usage limit exceeded for ${type}. Current: ${currentValue}, Limit: ${limits[type]}`,
        usage: {
          voicesGenerated: usage.voicesGenerated,
          pdfDownloads: usage.pdfDownloads,
          summarizationEdits: usage.summarizationEdits,
        },
        limits,
      });
    }

    await usage.save();

    res.json({
      success: true,
      usage: {
        voicesGenerated: usage.voicesGenerated,
        pdfDownloads: usage.pdfDownloads,
        summarizationEdits: usage.summarizationEdits,
      },
      limits,
    });
  } catch (err) {
    next(err);
  }
}

function getPlanLimits(plan: any) {
  // Free tier: 20 voices, 20 PDFs, 20 summary edits
  if (!plan || plan.period === "free") {
    return {
      voices: 20,
      edits: 20,
      pdfs: 20,
    };
  }
  // One-Time: 10 voices, 2 edits, 2 PDFs
  if (plan.period === "one-time") {
    return {
      voices: 10,
      edits: 2,
      pdfs: 2,
    };
  }
  // Monthly or Yearly - unlimited voices, limited edits and PDFs per period
  return {
    voices: -1,
    edits: 50,
    pdfs: 20,
  };
}
