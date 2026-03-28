import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.JWT_SECRET || "dev-secret";
  try {
    const decoded = jwt.verify(token, secret) as any;
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
