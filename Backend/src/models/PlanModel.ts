import mongoose, { Schema } from "mongoose";

export interface Plan {
  name: string;
  price: number;
  currency: string;
  period: "one-time" | "monthly" | "yearly";
  stripePriceId?: string;
  stripeProductId?: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
}

const planSchema = new Schema<Plan>(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    period: { type: String, required: true, enum: ["one-time", "monthly", "yearly"] },
    stripePriceId: { type: String },
    stripeProductId: { type: String },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PlanModel = mongoose.model<Plan>("Plan", planSchema);
