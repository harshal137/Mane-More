import express from "express";
const router = express.Router();
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";
import {
  createAnalyticsRecord,
  getAllAnalytics,
  getAnalyticsSummary,
  getUserActivity
} from "../controller/analytics.controller.js";

// CREATE ANALYTICS RECORD
router.post("/", createAnalyticsRecord);

// GET ALL ANALYTICS RECORDS - Admin only
router.get("/", protect, adminAuth, getAllAnalytics);

// GET ANALYTICS SUMMARY - Admin only
router.get("/summary", protect, adminAuth, getAnalyticsSummary);

// GET USER ACTIVITY - Admin only
router.get("/user/:userId", protect, adminAuth, getUserActivity);

export default router;