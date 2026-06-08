import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.model.js";
import hairProducts from "../data/hairproduct_mongoose.js";

dotenv.config();

const seedProducts = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await Product.insertMany(hairProducts);

    console.log("Hair products inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
};

seedProducts();