import mongoose, { Schema } from "mongoose";

export interface UserRecording {
  userId: string;
  transcribedText: string;
  summarizedText?: string;
  createdAt: Date;
}

const userRecordingSchema = new Schema<UserRecording>(
  {
    userId: { type: String, required: true, index: true },
    transcribedText: { type: String, required: true },
    summarizedText: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserRecordingModel = mongoose.model<UserRecording>("UserRecording", userRecordingSchema);
