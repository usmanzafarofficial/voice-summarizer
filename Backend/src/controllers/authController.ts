import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createUser, findUserByEmail } from "../services/userStore.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "../models/user.js";
import { signAuthToken } from "../utils/jwt.js";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = signupSchema.parse(req.body);
    const passwordHash = await hashPassword(password);
    const user = await createUser({ name, email, passwordHash });
    const publicUser = toPublicUser(user);
    const token = signAuthToken(publicUser);
    res.status(201).json({ user: publicUser, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const publicUser = toPublicUser(user);
    const token = signAuthToken(publicUser);
    res.json({ user: publicUser, token });
  } catch (err) {
    next(err);
  }
}

