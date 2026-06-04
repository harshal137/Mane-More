import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const protect = asyncHandler(async (req, res, next) => {
  let token;

  const wantsAdminSession =
    req.headers["x-auth-scope"] === "admin" ||
    req.originalUrl?.includes("/auth/admin");

  // Supports separate customer/admin cookies plus Authorization header fallback.
  if (wantsAdminSession && req.cookies?.adminJwt) {
    token = req.cookies.adminJwt;
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (req.cookies?.adminJwt) {
    token = req.cookies.adminJwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SEC;

    if (!jwtSecret) {
      res.status(500);
      throw new Error("JWT_SECRET is not configured");
    }

    const decodedToken = jwt.verify(token, jwtSecret);

    // CHANGED: supports both userId and _id inside token
    const userId = decodedToken.userId || decodedToken._id || decodedToken.id;

    if (!userId) {
      res.status(401);
      throw new Error("Not authorized, invalid token payload");
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, invalid or expired token");
  }
});

export default protect;
