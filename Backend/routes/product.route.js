import {
  ratingProduct,
  getALLproducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controller/product.controller.js";
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";
import express from "express";
const router = express.Router();

// RATING PRODUCT ROUTE
router.put("/rating/:id", ratingProduct);
// GET ALL PRODUCTS
router.get("/", getALLproducts);
// GET ONE PRODUCT
router.get("/find/:id", getProduct);
//CREATE PRODUCT - Admin only
router.post("/", protect, adminAuth, createProduct);
// UPDATE PRODUCT - Admin only
router.put("/:id", protect, adminAuth, updateProduct);

//DELETE PRODUCT - Admin only
router.delete("/:id", protect, adminAuth, deleteProduct);

export default router;
