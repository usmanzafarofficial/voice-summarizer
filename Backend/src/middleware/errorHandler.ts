import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.flatten(),
    });
  }

  const statusCode =
    typeof (err as any)?.statusCode === "number" ? (err as any).statusCode : 500;

  const message =
    statusCode === 500 ? "Internal server error" : String((err as any)?.message);

  return res.status(statusCode).json({ error: message });
};

