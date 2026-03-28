import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/authRoutes.js";
import { planRoutes } from "./routes/planRoutes.js";
import { subscriptionRoutes } from "./routes/subscriptionRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";
import { usageRoutes } from "./routes/usageRoutes.js";
import { summarizeRoutes } from "./routes/summarizeRoutes.js";
import { userDataRoutes } from "./routes/userDataRoutes.js";
import { handleWebhook } from "./controllers/webhookController.js";
import { errorHandler } from "./middleware/errorHandler.js";

function parseOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();

  const origins = parseOrigins();
  app.use(
    cors({
      origin: origins ?? true,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/webhook/stripe", express.raw({ type: "application/json" }), handleWebhook);

  app.use(express.json({ limit: "2mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/plans", planRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/usage", usageRoutes);
  app.use("/api/summarize", summarizeRoutes);
  app.use("/api/user-data", userDataRoutes);

  app.use(errorHandler);

  return app;
}

