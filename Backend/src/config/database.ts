import mongoose from "mongoose";

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log("Connected to MongoDB");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  // eslint-disable-next-line no-console
  console.log("Disconnected from MongoDB");
}
