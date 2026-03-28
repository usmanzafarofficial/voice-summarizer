import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

const summarizeSchema = z.object({
  text: z.string().min(1),
});

export async function summarizeText(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { text } = summarizeSchema.parse(req.body);
    const rawKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    // Remove all whitespace, newlines, and ensure no hidden characters
    const apiKey = rawKey?.trim().replace(/\s+/g, "").replace(/\r?\n/g, "");

    if (!apiKey) {
      console.error("API Key is not set in environment variables");
      return res.status(500).json({ error: "API key not configured" });
    }

    // Debug: Log first and last few characters of key
    console.log("API Key check:", {
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 5),
      keySuffix: apiKey.substring(apiKey.length - 4),
    });

    // Call native Gemini REST API to summarize the text
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a text summarization expert. Your ONLY task is to make the text SHORTER and more concise while keeping the core meaning.\n\nCRITICAL RULES:\n1. The output MUST be significantly shorter than the input (aim for 40-60% of original length)\n2. Remove all filler words, repetitions, and unnecessary words\n3. Combine ideas into fewer, clearer sentences\n4. Fix grammar and spelling errors\n5. Keep only essential information - remove redundant phrases\n6. Make it concise and professional\n\nReturn ONLY the shortened summary text. Do NOT add explanations, do NOT say 'Here is the summary', just return the condensed text directly.\n\nText to summarize:\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent, concise output
        },
      }),
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      
      console.error("API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      let errorMessage = "Failed to summarize text";
      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      // Check for common API key errors
      if (response.status === 401) {
        errorMessage = "Invalid API key. Please check your API key configuration.";
      } else if (response.status === 429) {
        errorMessage = "API rate limit exceeded. Please try again later.";
      }
      
      return res.status(response.status).json({
        error: errorMessage,
      });
    }

    const data = await response.json() as any;

    const summarizedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate summary";

    res.json({ summarizedText });
  } catch (err) {
    next(err);
  }
}

