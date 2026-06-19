import express from "express";
import {
  getCatalogOptions,
  updateCatalogOptions,
} from "../controller/catalogOptions.controller.js";
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";

const router = express.Router();

router.get("/", getCatalogOptions);
router.put("/", protect, adminAuth, updateCatalogOptions);

export default router;
