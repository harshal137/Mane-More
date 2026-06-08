import mongoose from "mongoose";

const ProductSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  img: {
    type: [String], // Changed from String to Array of Strings
    required: true,
  },
  video: {
    type: String,
  },
  categories: {
    type: [String], // Changed to array for consistency
  },
  brand: {
    type: String,
  },
  originalPrice: {
    type: Number,
  },
  discountedPrice: {
    type: Number,
  },
  items_per_box: {
    type: Number, // Changed to Number to represent quantity
    default: 1,
  },
  type: {
    type: [String],
  },
  size: {
    type: [String], // Changed to array for multiple sizes
    default: [],
  },
  stock: {
    type: Number,
    default: 20,
  },
  ratings: [
    {
      star: { type: String },
      name: { type: String },
      comment: { type: String },
      postedBy: { type: String },
    },
  ],

}, {
  timestamps: true // Added timestamps for better data management
});

ProductSchema.index({ "$**": "text" });

const Product = mongoose.model("Product", ProductSchema);
export default Product;




