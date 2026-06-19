import asyncHandler from "express-async-handler";
import CatalogOptions from "../models/catalogOptions.model.js";

const DEFAULT_CATALOG_OPTIONS = {
  categories: ["HairExtensions", "HairCare", "Beard & Shaving", "SkinCare"],
  brands: ["Astra", "Derby", "Dorco", "Gummy", "Mane & More", "Permasharp", "Redone"],
  brandsByCategory: {
    HairExtensions: ["Mane & More"],
    HairCare: ["Gummy", "Redone"],
    "Beard & Shaving": ["Astra", "Derby", "Dorco", "Permasharp"],
    SkinCare: ["Gummy"],
  },
  sizes: ["50ML", "100ML", "150ML", "200ML", "250ML", "500ML", "1L", "Small", "Medium", "Large"],
  typesByCategory: {
    HairExtensions: ["Straight", "Body Wave", "Deep Wave", "Loose Wave", "Water Wave", "Kinky Curly", "Jerry Curl"],
    HairCare: [
      "Hair Wax",
      "Hair Gel",
      "Hair Spray",
      "Hair Powder",
      "Hair Mousse",
      "Pomade",
      "Hair Cream",
      "Hair Tonic",
      "Shampoo",
      "Sea Salt Spray",
      "Foam",
      "Styling Cream",
      "Hair Clay",
      "Hair Paste",
      "Hair Oil",
    ],
    "Beard & Shaving": [
      "Beard Oil",
      "Beard Shampoo",
      "Beard Conditioner",
      "Beard Wax",
      "Shaving Gel",
      "Shaving Cream",
      "Razor Blades",
      "Aftershave",
      "Cologne",
      "Aftershave Cologne",
      "Neck Strips",
    ],
    SkinCare: ["Bump Repair Spray", "Cream Cologne", "Face Scrub", "Face Tonic", "Clay Mask", "Coffee Scrub"],
  },
};

const uniqueCleanStrings = (values = []) => [
  ...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  ),
];

const normalizeTypesByCategory = (typesByCategory = {}, categories = []) => {
  const normalized = {};

  categories.forEach((category) => {
    normalized[category] = uniqueCleanStrings(typesByCategory[category]);
  });

  return normalized;
};

const normalizeOptionsByCategory = (optionsByCategory = {}, categories = []) => {
  const normalized = {};

  categories.forEach((category) => {
    normalized[category] = uniqueCleanStrings(optionsByCategory[category]);
  });

  return normalized;
};

const toResponse = (options) => ({
  categories: options.categories || [],
  brands: options.brands || [],
  brandsByCategory: Object.fromEntries(options.brandsByCategory || []),
  sizes: options.sizes || [],
  typesByCategory: Object.fromEntries(options.typesByCategory || []),
});

const ensureCatalogOptions = async () => {
  const options = await CatalogOptions.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default", ...DEFAULT_CATALOG_OPTIONS } },
    { new: true, upsert: true }
  );

  return options;
};

const getCatalogOptions = asyncHandler(async (req, res) => {
  const options = await ensureCatalogOptions();
  res.status(200).json(toResponse(options));
});

const updateCatalogOptions = asyncHandler(async (req, res) => {
  const categories = uniqueCleanStrings(req.body.categories);

  if (categories.length > 5) {
    res.status(400);
    throw new Error("No more than 5 categories are allowed");
  }

  const options = await CatalogOptions.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        categories,
        brands: uniqueCleanStrings(req.body.brands),
        brandsByCategory: normalizeOptionsByCategory(req.body.brandsByCategory, categories),
        sizes: uniqueCleanStrings(req.body.sizes),
        typesByCategory: normalizeTypesByCategory(req.body.typesByCategory, categories),
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json(toResponse(options));
});

export { DEFAULT_CATALOG_OPTIONS, getCatalogOptions, updateCatalogOptions };
