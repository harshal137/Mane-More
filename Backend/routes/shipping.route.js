import express from "express";
import {
  getShippingCharges,
  updateShippingCharges,
} from "../controller/shipping.controller.js";
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";

const router = express.Router();

router.get("/", getShippingCharges);
router.put("/", protect, adminAuth, updateShippingCharges);

export default router;
