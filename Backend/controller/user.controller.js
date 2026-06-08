import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone = "",
    address = "",
    role = "user",
  } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || "user").toLowerCase();

  if (!name?.trim() || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password should be at least 6 characters long");
  }

  if (!["user", "admin"].includes(normalizedRole)) {
    res.status(400);
    throw new Error("Role must be user or admin");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: String(phone || "").trim(),
    address: String(address || "").trim(),
    role: normalizedRole,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

// UPDATE USER

const updateUser = asyncHandler(async (req, res) => {
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    res.status(400);
    throw new Error("User was not updated");
  } else {
    res.status(201).json(updatedUser);
  }
});

const updateMyProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const allowedUpdates = {
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
  };

  Object.keys(allowedUpdates).forEach((key) => {
    if (allowedUpdates[key] === undefined) {
      delete allowedUpdates[key];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    res.status(404);
    throw new Error("User was not found");
  }

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone || "",
    address: updatedUser.address || "",
    role: updatedUser.role,
  });
});

const updateMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password should be at least 6 characters long");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User was not found");
  }

  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
});

const checkMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword } = req.body;

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (!currentPassword) {
    res.status(400);
    throw new Error("Current password is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User was not found");
  }

  const isCorrect = await user.matchPassword(currentPassword);

  res.status(200).json({
    isCorrect,
    message: isCorrect ? "Current password is correct" : "Current password is incorrect",
  });
});

// DELETE USER
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (req.user?._id?.toString() === userId) {
    res.status(400);
    throw new Error("You cannot delete your own admin account");
  }

  const targetUser = await User.findById(userId);

  if (!targetUser) {
    res.status(404);
    throw new Error("User was not found");
  }

  const deleteUserData = async (session = null) => {
    const userEmail = String(targetUser.email || "").trim().toLowerCase();
    const paymentBaseFilter = {
      $or: [
        { userId },
        { "customer.email": userEmail },
        { email: userEmail },
      ],
    };

    const matchingPayments = await Payment.find(paymentBaseFilter)
      .select("_id orderId")
      .session(session);
    const paymentIds = matchingPayments.map((payment) => payment._id);
    const orderIdsFromPayments = matchingPayments
      .map((payment) => payment.orderId)
      .filter(Boolean);

    const orderBaseFilter = {
      $or: [
        { userId },
        { email: userEmail },
        { paymentId: { $in: paymentIds } },
        { _id: { $in: orderIdsFromPayments } },
      ],
    };

    const matchingOrders = await Order.find(orderBaseFilter)
      .select("_id paymentId")
      .session(session);
    const orderIds = matchingOrders.map((order) => order._id);
    const paymentIdsFromOrders = matchingOrders
      .map((order) => order.paymentId)
      .filter(Boolean);

    const finalOrderFilter = {
      $or: [
        { userId },
        { email: userEmail },
        { _id: { $in: orderIds } },
        { paymentId: { $in: [...paymentIds, ...paymentIdsFromOrders] } },
      ],
    };

    const finalPaymentFilter = {
      $or: [
        { userId },
        { "customer.email": userEmail },
        { email: userEmail },
        { _id: { $in: [...paymentIds, ...paymentIdsFromOrders] } },
        { orderId: { $in: orderIds } },
      ],
    };

    const [ordersResult, paymentsResult] = await Promise.all([
      Order.deleteMany(finalOrderFilter).session(session),
      Payment.deleteMany(finalPaymentFilter).session(session),
    ]);

    const deletedUser = await User.findByIdAndDelete(userId)
      .select("-password")
      .session(session);

    return {
      deletedUser,
      deletedOrders: ordersResult.deletedCount || 0,
      deletedPayments: paymentsResult.deletedCount || 0,
    };
  };

  let result;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      result = await deleteUserData(session);
    });
  } catch (error) {
    console.warn("User cascade delete transaction failed; retrying without transaction", {
      userId,
      error: error.message,
    });
    result = await deleteUserData();
  } finally {
    await session.endSession();
  }

  const { deletedUser, deletedOrders, deletedPayments } = result;

  if (!deletedUser) {
    res.status(404);
    throw new Error("User was not deleted successfully");
  }

  res.status(200).json({
    message: "User and related records deleted successfully",
    deletedUser: {
      _id: deletedUser._id,
      name: deletedUser.name,
      email: deletedUser.email,
      role: deletedUser.role,
    },
    deletedOrders,
    deletedPayments,
  });
});

// GET ONE USER
const getUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.params.id;

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
    res.status(403);
    throw new Error("Access denied");
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User was not found");
  }

  res.status(200).json(user);
});

// GET ALL USERS
const getAllUsers = asyncHandler(async(req,res) =>{
    const users = await User.find();
    if(!users){
        res.status(400);
        throw new Error("Users were not feteched.")
    }else{
        res.status(200).json(users);
    }
})

export {
  createUser,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  updateMyProfile,
  updateMyPassword,
  checkMyPassword,
};
