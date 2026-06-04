import Product from "../models/product.model.js";
import asyncHandler from "express-async-handler";

// CREATE PRODUCT
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  if (product) {
    res.status(201).json(product);
  } else {
    res.status(400);
    throw new Error("Product was not created");
  }
});

// UPDATE PRODUCT
const updateProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      $set: req.body,
    },
    { new: true }
  );

  if (!updatedProduct) {
    res.status(400);
    throw new Error("Product has not been updated");
  } else {
    res.status(200).json(updatedProduct);
  }
});

// DELETE PRODUCT
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(400);
    throw new Error("Product was not deleted");
  } else {
    res.status(200).json({ message: "Product deleted successfully" });
  }
});

// GET PRODUCT
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json(product);
});


// GET ALL PRODUCTS
const getALLproducts = asyncHandler(async (req, res) => {
  const qNew = req.query.new;
  const qCategory = req.query.category;
  const qSearch = req.query.search;
  const qType = req.query.type;
  const qBrand = req.query.brand;
  const qSort = req.query.sort;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 32, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  // CATEGORY FILTER
  // DB categories: Hair Care, Beard & Shaving, Skin Care, Fragrance
  if (qCategory) {
    filter.categories = { $in: [qCategory] };
  }

  // TYPE FILTER
  // Example: Hair Wax, Hair Gel, Beard Oil
  if (qType) {
    filter.type = qType;
  }

  // BRAND FILTER
  // Example: Redone, Gummy, Astra
  if (qBrand) {
    filter.brand = qBrand;
  }

  // SEARCH FILTER
  // Requires text index in MongoDB
  if (qSearch) {
    filter.$text = {
      $search: qSearch,
      $caseSensitive: false,
      $diacriticSensitive: false,
    };
  }

  // SORTING
  let sort = { createdAt: -1 };

  if (qNew) {
    sort = { createdAt: -1 };
  }

  if (qSort === "newest") {
    sort = { createdAt: -1 };
  }

  if (qSort === "asc") {
    sort = { originalPrice: 1 };
  }

  if (qSort === "desc") {
    sort = { originalPrice: -1 };
  }

  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  res.status(200).json(products);
});

// RATING PRODUCT
const ratingProduct = asyncHandler(async (req, res) => {
  const { star, name, comment, postedBy } = req.body;

  if (!star) {
    res.status(400);
    throw new Error("Product rating value is required");
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      $push: { ratings: { star, name, comment, postedBy } },
    },
    { new: true }
  );

  if (!updatedProduct) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(201).json(updatedProduct);
});

export { ratingProduct, getALLproducts, getProduct, createProduct, updateProduct, deleteProduct };
