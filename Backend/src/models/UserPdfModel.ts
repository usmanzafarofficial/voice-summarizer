import mongoose, { Schema } from "mongoose";

export interface UserPdf {
  userId: string;
  summaryText: string;
  fileName: string;
  createdAt: Date;
}

const userPdfSchema = new Schema<UserPdf>(
  {
    userId: { type: String, required: true, index: true },
    summaryText: { type: String, required: true },
    fileName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserPdfModel = mongoose.model<UserPdf>("UserPdf", userPdfSchema);
