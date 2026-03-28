import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

async function start() {
  try {
    await connectDatabase();
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

