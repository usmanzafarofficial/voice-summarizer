import mongoose, { Schema } from "mongoose";

export interface UserSubscription {
  userId: string;
  planId: string;
  planName: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  status: "active" | "canceled" | "expired" | "pending" | "completed";
  startDate: Date;
  endDate?: Date;
  amountPaid: number;
  currency: string;
  period: "one-time" | "monthly" | "yearly";
}

const userSubscriptionSchema = new Schema<UserSubscription>(
  {
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    stripeSubscriptionId: { type: String },
    stripePaymentIntentId: { type: String },
    stripeCustomerId: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["active", "canceled", "expired", "pending", "completed"],
      default: "pending",
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    amountPaid: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    period: { type: String, required: true, enum: ["one-time", "monthly", "yearly"] },
  },
  { timestamps: true }
);

export const UserSubscriptionModel = mongoose.model<UserSubscription>(
  "UserSubscription",
  userSubscriptionSchema
);
