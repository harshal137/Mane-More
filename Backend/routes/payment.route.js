import express from "express";
const router = express.Router();

import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";

import {
  getAllPayments,
  deletePayment,
  getPaymentById,
  getPaymentsByStatus,
  updatePayment,
} from "../controller/payment.controller.js";

// GET ALL PAYMENTS ROUTE - Admin only
router.get("/", protect, adminAuth, getAllPayments);

// IMPORTANT: keep this before "/:id", otherwise "status" is treated as an id.
router.get("/status/:status", protect, adminAuth, getPaymentsByStatus);

// GET PAYMENT BY ID - Admin only because it can contain sensitive details
router.get("/:id", protect, adminAuth, getPaymentById);

// UPDATE PAYMENT ROUTE - Admin only
router.put("/:id", protect, adminAuth, updatePayment);

// DELETE PAYMENT ROUTE - Admin only
router.delete("/:id", protect, adminAuth, deletePayment);

export default router;
