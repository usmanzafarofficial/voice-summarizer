import type { Request, Response, NextFunction } from "express";
import { UserRecordingModel } from "../models/UserRecordingModel.js";
import { UserSummaryModel } from "../models/UserSummaryModel.js";
import { UserPdfModel } from "../models/UserPdfModel.js";

export async function getUserRecordings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recordings = await UserRecordingModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(recordings);
  } catch (err) {
    next(err);
  }
}

export async function getUserSummaries(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const summaries = await UserSummaryModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(summaries);
  } catch (err) {
    next(err);
  }
}

export async function getUserPdfs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pdfs = await UserPdfModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(pdfs);
  } catch (err) {
    next(err);
  }
}

export async function saveRecording(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { transcribedText, summarizedText } = req.body;

    if (!transcribedText) {
      return res.status(400).json({ error: "Transcribed text is required" });
    }

    // Try to find existing recording with same text (created recently, within last minute)
    const recentRecording = await UserRecordingModel.findOne({
      userId,
      transcribedText,
      createdAt: { $gte: new Date(Date.now() - 60000) },
    }).sort({ createdAt: -1 });

    if (recentRecording) {
      // Update existing recording with summary if provided
      if (summarizedText) {
        recentRecording.summarizedText = summarizedText;
        await recentRecording.save();
      }
      return res.json(recentRecording);
    }

    const recording = await UserRecordingModel.create({
      userId,
      transcribedText,
      summarizedText,
    });

    res.json(recording);
  } catch (err) {
    next(err);
  }
}

export async function updateRecordingWithSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { transcribedText, summarizedText } = req.body;

    if (!transcribedText || !summarizedText) {
      return res.status(400).json({ error: "Transcribed text and summarized text are required" });
    }

    // Find the most recent recording with this transcribed text
    const recording = await UserRecordingModel.findOne({
      userId,
      transcribedText,
    }).sort({ createdAt: -1 });

    if (recording) {
      recording.summarizedText = summarizedText;
      await recording.save();
      return res.json(recording);
    }

    return res.status(404).json({ error: "Recording not found" });
  } catch (err) {
    next(err);
  }
}

export async function saveSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { originalText, summarizedText } = req.body;

    if (!originalText || !summarizedText) {
      return res.status(400).json({ error: "Original text and summarized text are required" });
    }

    const summary = await UserSummaryModel.create({
      userId,
      originalText,
      summarizedText,
    });

    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function savePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { summaryText, fileName } = req.body;

    if (!summaryText || !fileName) {
      return res.status(400).json({ error: "Summary text and file name are required" });
    }

    const pdf = await UserPdfModel.create({
      userId,
      summaryText,
      fileName,
    });

    res.json(pdf);
  } catch (err) {
    next(err);
  }
}
