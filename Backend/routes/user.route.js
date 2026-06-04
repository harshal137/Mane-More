import express from "express";
const router = express.Router();
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";
import {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  updateMyProfile,
  updateMyPassword,
  checkMyPassword,
} from "../controller/user.controller.js";


//GET ALL USERS ROUTE - Admin only
router.get("/", protect, adminAuth, getAllUsers);

// DELETE USER ROUTE - Admin only
router.delete("/:id", protect, adminAuth, deleteUser);

// UPDATE LOGGED-IN CUSTOMER PROFILE
router.put("/me/profile", protect, updateMyProfile);

// UPDATE LOGGED-IN CUSTOMER PASSWORD
router.put("/me/password", protect, updateMyPassword);

// CHECK LOGGED-IN CUSTOMER CURRENT PASSWORD
router.post("/me/password/check", protect, checkMyPassword);

// UPDATE USER ROUTE - Admin only
router.put("/:id", protect, adminAuth, updateUser);

//GET ONE USER ROUTE - Protected route for fetching a user's profile
router.get("/find/:userId", protect, getUser)

export default router;
