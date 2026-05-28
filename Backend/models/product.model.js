// import mongoose from "mongoose";

// const ProductSchema = mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
//   desc: {
//     type: String,
//     required: true,
//   },
//   whatinbox: {
//     type: String,
//   },
//   img: {
//     type: [String], // Changed from String to Array of Strings
//     required: true,
//   },
//   video: {
//     type: String,
//   },
//   wholesalePrice: {
//     type: Number,
//   },
//   wholesaleMinimumQuantity: {
//     type: Number,
//   },
//   categories: {
//     type: [String], // Changed to array for consistency
//   },
//   concern: {
//     type: [String],
//   },
//   brand: {
//     type: String,
//   },
//   skintype: {
//     type: [String],
//   },
//   originalPrice: {
//     type: Number,
//   },
//   discountedPrice: {
//     type: Number,
//   },
//   inStock: {
//     type: Boolean,
//     default: true,
//   },
//   ratings: [
//     {
//       star: { type: String },
//       name: { type: String },
//       comment: { type: String },
//       postedBy: { type: String },
//     },
//   ],
// }, {
//   timestamps: true // Added timestamps for better data management
// });

// ProductSchema.index({"$**":"text"});

// const Product = mongoose.model("Product", ProductSchema);
// export default Product;




import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    desc: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    bestseller: {
      type: Boolean,
      default: false,
    },

    image: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;