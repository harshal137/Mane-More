import asyncHandler from "express-async-handler";

const adminAuth = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, please login first");
  }

  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Administrator privileges required.");
  }

  next();
});

export default adminAuth;
