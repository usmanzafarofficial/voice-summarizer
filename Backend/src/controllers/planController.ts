import type { Request, Response, NextFunction } from "express";
import { PlanModel } from "../models/PlanModel.js";

export async function getPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await PlanModel.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
    res.json(plans);
  } catch (err) {
    next(err);
  }
}
