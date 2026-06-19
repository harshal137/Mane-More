import mongoose from "mongoose";

const CatalogOptionsSchema = mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: (categories) => categories.length <= 5,
        message: "No more than 5 categories are allowed",
      },
    },
    brands: {
      type: [String],
      default: [],
    },
    brandsByCategory: {
      type: Map,
      of: [String],
      default: {},
    },
    sizes: {
      type: [String],
      default: [],
    },
    typesByCategory: {
      type: Map,
      of: [String],
      default: {},
    },
  },
  { timestamps: true }
);

const CatalogOptions = mongoose.model("CatalogOptions", CatalogOptionsSchema);
export default CatalogOptions;
