import express from "express";
const router = express.Router();
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";
import {
  createBanner,
  getAllBanners,
  getRandomBanner,
  deleteBanner,
} from "../controller/banner.controller.js";

// CREATE BANNER ROUTE - Admin only
router.post("/", protect, adminAuth, createBanner);

// GET ALL BANNERS ROUTE - Admin only
router.get("/", protect, adminAuth, getAllBanners);

// DELETE BANNER ROUTE - Admin only
router.delete("/:id", protect, adminAuth, deleteBanner);

// GET RANDOM BANNER ROUTE
router.get("/random", getRandomBanner);

export default router;
