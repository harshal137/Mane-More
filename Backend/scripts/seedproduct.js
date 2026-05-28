import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.model.js";
import hairProducts from "../data/hairproduct.js";

dotenv.config();

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.DB);

    await Product.insertMany(hairProducts);

    console.log("Hair products inserted successfully");
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedProducts();