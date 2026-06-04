import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    mongoose.connection.on("connected", () => {
      console.log("Background services MongoDB connected");
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error.message);
    });

    await mongoose.connect(uri);
  } catch (error) {
    console.error(error.message || error);
    setTimeout(dbConnection, 5000);
  }
};

export default dbConnection;
