import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { summarizeText } from "../controllers/summarizeController.js";

export const summarizeRoutes = Router();

summarizeRoutes.post("/text", authenticateToken, summarizeText);
