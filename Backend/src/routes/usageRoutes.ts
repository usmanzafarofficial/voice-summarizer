import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getUserUsage, incrementUsage } from "../controllers/usageController.js";

export const usageRoutes = Router();

usageRoutes.get("/", authenticateToken, getUserUsage);
usageRoutes.post("/increment", authenticateToken, incrementUsage);
