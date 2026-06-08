import express from "express";
const router = express.Router();

import {
  getAllOrders,
  getUserOrder,
  deleteOrder,
  createOrder,
  createCODOrder,
  updateOrder,
  getOrderById,
  cancelOrder,
} from "../controller/order.controller.js";

import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";

// CREATE COD ORDER ROUTE - logged in user
router.post("/cod", protect, createCODOrder);

// CREATE ORDER ROUTE
// Keep this only if old admin/manual flow needs it.
// Do not call this from Stripe Pay Now frontend.
router.post("/", protect, createOrder);

// GET SINGLE ORDER BY ID - Admin only
router.get("/findorder/:id", protect, adminAuth, getOrderById);

// GET USER'S ORDER ROUTE
router.get("/find/:id",protect, getUserOrder);

// GET ALL ORDERS ROUTE - Admin only
router.get("/", protect, adminAuth, getAllOrders);

// CANCEL ORDER ROUTE - order owner only
router.put("/:id/cancel", protect, cancelOrder);

// UPDATE ORDER ROUTE - Admin only
router.put("/:id", protect, adminAuth, updateOrder);

// DELETE ORDER ROUTE - Admin only
router.delete("/:id", protect, adminAuth, deleteOrder);

export default router;
