import mongoose, { Schema } from "mongoose";

export interface UserUsage {
  userId: string;
  period: "one-time" | "monthly" | "yearly" | "free";
  periodStart: Date; // Start of current billing period
  periodEnd?: Date; // End of current billing period (for monthly/yearly)
  voicesGenerated: number; // Total AI voices generated
  pdfDownloads: number; // PDFs downloaded
  summarizationEdits: number; // Editable summarizations created
  lastReset?: Date; // Last time usage was reset (for monthly/yearly plans)
}

const userUsageSchema = new Schema<UserUsage>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    period: { type: String, required: true, enum: ["one-time", "monthly", "yearly", "free"] },
    periodStart: { type: Date, required: true, default: Date.now },
    periodEnd: { type: Date },
    voicesGenerated: { type: Number, default: 0 },
    pdfDownloads: { type: Number, default: 0 },
    summarizationEdits: { type: Number, default: 0 },
    lastReset: { type: Date },
  },
  { timestamps: true }
);

export const UserUsageModel = mongoose.model<UserUsage>("UserUsage", userUsageSchema);
