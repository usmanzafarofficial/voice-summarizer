import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  createCheckout,
  getUserSubscriptions,
  confirmCheckout,
  submitManualPayment,
} from "../controllers/subscriptionController.js";

export const subscriptionRoutes = Router();

subscriptionRoutes.post("/checkout", authenticateToken, createCheckout);
subscriptionRoutes.post("/confirm", authenticateToken, confirmCheckout);
subscriptionRoutes.post("/manual", authenticateToken, submitManualPayment);
subscriptionRoutes.get("/", authenticateToken, getUserSubscriptions);
