import crypto from "node:crypto";
import type { User } from "../models/user.js";
import { UserModel } from "../models/UserModel.js";

export async function findUserByEmail(email: string): Promise<User | null> {
  const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  const exists = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (exists) {
    const err = new Error("Email already in use");
    (err as any).statusCode = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: now,
  };

  await UserModel.create(user);
  return user;
}

