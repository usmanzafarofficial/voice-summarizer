import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  createCheckout,
  getUserSubscriptions,
  confirmCheckout,
} from "../controllers/subscriptionController.js";

export const subscriptionRoutes = Router();

subscriptionRoutes.post("/checkout", authenticateToken, createCheckout);
subscriptionRoutes.post("/confirm", authenticateToken, confirmCheckout);
subscriptionRoutes.get("/", authenticateToken, getUserSubscriptions);
