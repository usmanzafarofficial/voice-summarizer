import mongoose, { Schema } from "mongoose";
import type { User } from "./user.js";

const userSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    profilePicture: { type: String },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
);

export const UserModel = mongoose.model<User>("User", userSchema);
