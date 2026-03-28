import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getUserRecordings,
  getUserSummaries,
  getUserPdfs,
  saveRecording,
  saveSummary,
  savePdf,
  updateRecordingWithSummary,
} from "../controllers/userDataController.js";

export const userDataRoutes = Router();

userDataRoutes.get("/recordings", authenticateToken, getUserRecordings);
userDataRoutes.get("/summaries", authenticateToken, getUserSummaries);
userDataRoutes.get("/pdfs", authenticateToken, getUserPdfs);
userDataRoutes.post("/recordings", authenticateToken, saveRecording);
userDataRoutes.put("/recordings/summary", authenticateToken, updateRecordingWithSummary);
userDataRoutes.post("/summaries", authenticateToken, saveSummary);
userDataRoutes.post("/pdfs", authenticateToken, savePdf);
