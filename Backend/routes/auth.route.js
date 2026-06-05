import express from "express";
import {
  getAdminMe,
  getMe,
  forgotAdminPassword,
  forgotPassword,
  loginAdmin,
  loginUser,
  logOut,
  logOutAdmin,
  registerUser,
  resetAdminPassword,
  resetUserPassword,
  verifyResetCode,
} from "../controller/auth.controller.js";
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";
const router = express.Router();

// REGISTER USER ROUTER
router.post("/register", registerUser);

//LOGIN USER ROUTER
router.post("/login", loginUser);

// USER FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);

// USER RESET PASSWORD
router.post("/reset-password", resetUserPassword);

// USER VERIFY PASSWORD RESET CODE
router.post("/verify-reset-code", verifyResetCode);

// LOGIN ADMIN ROUTER
router.post("/admin/login", loginAdmin);

// ADMIN FORGOT PASSWORD
router.post("/admin/forgot-password", forgotAdminPassword);

// ADMIN RESET PASSWORD
router.post("/admin/reset-password", resetAdminPassword);

// LOGOUT USER
router.get("/logout", logOut);
router.post("/logout", logOut);

// ADMIN LOGOUT
router.post("/admin/logout", logOutAdmin);

// CURRENT USER
router.get("/me", protect, getMe);

// CURRENT ADMIN
router.get("/admin/me", protect, adminAuth, getAdminMe);

export default router;
