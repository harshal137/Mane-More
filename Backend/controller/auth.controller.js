import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import generateToken from "../util/generateToken.js";
import crypto from "crypto";

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  address: user.address || "",
  role: user.role,
});

// REGISTER USER
// route POST /api/v1/auth/register
// @access public

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone = "", address = "" } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    address,
    role: "user",
  });

  if (user) {
    generateToken(res, user._id, "jwt");
    res.status(201).json(publicUser(user));
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

//LOGIN USER
// route POST /api/v1/auth/login
//@access public

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(password))) {
    if (user.role !== "user") {
      res.status(403);
      throw new Error("Please use the admin login page for this account");
    }

    generateToken(res, user._id, "jwt");
    res.status(200).json(publicUser(user));
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(password))) {
    if (user.role !== "admin") {
      res.status(403);
      throw new Error("Access denied. Administrator privileges required.");
    }

    generateToken(res, user._id, "adminJwt");
    res.status(200).json(publicUser(user));
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const createResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  return { resetToken, hashedToken };
};

const getResetUrl = (scope, token) => {
  const baseUrl =
    scope === "admin"
      ? process.env.ADMIN_URL || "http://localhost:5174"
      : process.env.CLIENT_URL || "http://localhost:5173";

  return `${baseUrl}/reset-password?token=${token}&scope=${scope}`;
};

const requestPasswordReset = (scope) =>
  asyncHandler(async (req, res) => {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email: normalizedEmail, role: scope });

    // Do not reveal whether an account exists.
    if (!user) {
      return res.status(200).json({
        message: "If this account exists, password reset instructions are available.",
      });
    }

    const { resetToken, hashedToken } = createResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = getResetUrl(scope, resetToken);

    console.log(`${scope} password reset link: ${resetUrl}`);

    const response = {
      message: "Password reset token generated. Use it within 15 minutes.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.resetToken = resetToken;
      response.resetUrl = resetUrl;
    }

    return res.status(200).json(response);
  });

const resetPassword = (scope) =>
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400);
      throw new Error("Reset token and new password are required");
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error("Password should be at least 6 characters long");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      role: scope,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400);
      throw new Error("Reset token is invalid or expired");
    }

    user.password = password;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  });

const forgotPassword = requestPasswordReset("user");
const resetUserPassword = resetPassword("user");
const forgotAdminPassword = requestPasswordReset("admin");
const resetAdminPassword = resetPassword("admin");

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (req.user.role !== "user") {
    res.status(403);
    throw new Error("Customer account required");
  }

  res.status(200).json(publicUser(req.user));
});

const getAdminMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Administrator privileges required.");
  }

  res.status(200).json(publicUser(req.user));
});

// LOGOUT USER
// route POST /api/v1/auth/logout
//@access public

const logOut = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logout successfully" });
});

const logOutAdmin = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("adminJwt", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Admin logout successfully" });
});

export {
  getAdminMe,
  getMe,
  forgotAdminPassword,
  forgotPassword,
  logOut,
  logOutAdmin,
  loginAdmin,
  loginUser,
  registerUser,
  resetAdminPassword,
  resetUserPassword,
};
