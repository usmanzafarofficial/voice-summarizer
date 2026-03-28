import mongoose, { Schema } from "mongoose";

export interface UserSummary {
  userId: string;
  originalText: string;
  summarizedText: string;
  createdAt: Date;
}

const userSummarySchema = new Schema<UserSummary>(
  {
    userId: { type: String, required: true, index: true },
    originalText: { type: String, required: true },
    summarizedText: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserSummaryModel = mongoose.model<UserSummary>("UserSummary", userSummarySchema);
