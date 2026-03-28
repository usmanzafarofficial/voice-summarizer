import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: "Make this text significantly shorter."
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 50,
    }
  }),
}).then(async r => {
  console.log("Status:", r.status);
  const data = await r.json();
  fs.writeFileSync("output.json", JSON.stringify(data, null, 2), "utf8");
  console.log("Wrote to output.json");
}).catch(e => console.error("Fetch error:", e));
