import { Router } from "express";
import { getPlans } from "../controllers/planController.js";

export const planRoutes = Router();

planRoutes.get("/", getPlans);
