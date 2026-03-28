import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserModel } from "../models/UserModel.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "../models/user.js";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  profilePicture: z.string().optional(),
});

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await UserModel.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = updateProfileSchema.parse(req.body);
    const user = await UserModel.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.password) {
      user.passwordHash = await hashPassword(data.password);
    }

    if (data.profilePicture !== undefined) {
      user.profilePicture = data.profilePicture;
    }

    await user.save();
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}
