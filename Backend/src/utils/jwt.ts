import jwt from "jsonwebtoken";
import type { PublicUser } from "../models/user.js";

function mustGetEnv(key: string, fallback?: string) {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export function signAuthToken(user: PublicUser) {
  const secret = mustGetEnv("JWT_SECRET", "dev-secret") as jwt.Secret;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];

  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

