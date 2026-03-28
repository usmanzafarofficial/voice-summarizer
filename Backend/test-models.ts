import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(async r => {
    console.log("Status:", r.status);
    const body = await r.json();
    console.log("Models:", body.models?.map((m: any) => m.name).slice(0, 10));
  })
  .catch(e => console.error("Fetch error:", e));
