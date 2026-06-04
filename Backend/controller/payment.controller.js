import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "express-async-handler";

const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate("orderId").sort({ createdAt: -1 });
  res.status(200).json(payments);
});

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("orderId");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  res.status(200).json(payment);
});

const getPaymentsByStatus = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ payment_status: req.params.status })
    .populate("orderId")
    .sort({ createdAt: -1 });

  res.status(200).json(payments);
});

const updatePayment = asyncHandler(async (req, res) => {
  const existingPayment = await Payment.findById(req.params.id);

  if (!existingPayment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  const nextPaymentStatus = String(
    req.body.payment_status || req.body.status || existingPayment.payment_status
  ).toLowerCase();
  const nextTransactionStatus = String(
    req.body.status_of_transaction || existingPayment.status_of_transaction
  ).toLowerCase();
  const requestedPaymentStatus = String(req.body.payment_status || req.body.status || "").toLowerCase();
  const requestedTransactionStatus = String(req.body.status_of_transaction || "").toLowerCase();
  const isMarkedPaid =
    nextPaymentStatus === "success" ||
    nextPaymentStatus === "completed" ||
    nextTransactionStatus === "paid";
  const isMarkedUnpaid =
    requestedPaymentStatus === "failed" ||
    requestedPaymentStatus === "cancelled" ||
    requestedPaymentStatus === "incomplete" ||
    requestedTransactionStatus === "unpaid";

  if (isMarkedPaid) {
    req.body.payment_status = "success";
    req.body.status = "completed";
    req.body.status_of_transaction = "paid";
  }

  if (!isMarkedPaid && isMarkedUnpaid) {
    req.body.payment_status = "failed";
    req.body.status = "failed";
    req.body.status_of_transaction = "unpaid";
    req.body.failureReason = req.body.failureReason || "Marked failed by admin";
    req.body.failure_reason = req.body.failure_reason || req.body.failureReason;
  }

  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  ).populate("orderId");

  const orderId = payment.orderId?._id || payment.orderId;

  if (orderId && isMarkedPaid) {
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        payment_status: "success",
        status_of_transaction: "paid",
      },
    });
  }

  if (orderId && !isMarkedPaid && isMarkedUnpaid) {
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        payment_status: payment.payment_status,
        status_of_transaction: "unpaid",
      },
    });
  }

  const updatedPayment = await Payment.findById(payment._id).populate("orderId");

  res.status(200).json(updatedPayment);
});

const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  res.status(200).json({ message: "Payment deleted successfully" });
});

export {
  getAllPayments,
  getPaymentById,
  getPaymentsByStatus,
  updatePayment,
  deletePayment,
};
