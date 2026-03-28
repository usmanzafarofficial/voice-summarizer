import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

export const profileRoutes = Router();

profileRoutes.get("/", authenticateToken, getProfile);
profileRoutes.put("/", authenticateToken, updateProfile);
