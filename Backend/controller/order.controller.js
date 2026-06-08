import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { sendInngestEventSafely } from "../utils/sendInngestEventSafely.js";

const normalizeProductId = (item) => item.productId || item._id;
const normalizeStatus = (status = "") => String(status || "").trim().toLowerCase();
const shippingEmailStatuses = new Set(["shipped", "out for delivery", "arriving today"]);
const cancellableOrderStatuses = new Set(["placed", "processing"]);
const cancellationReasons = new Set([
  "Ordered by mistake",
  "Found a better price",
  "Need to change delivery address",
  "Delivery is taking too long",
  "Changed my mind",
  "Other",
]);

const decrementProductStockForDeliveredOrder = async (products = []) => {
  const quantityByProductId = new Map();

  products.forEach((product) => {
    const productId = normalizeProductId(product)?.toString();
    const quantity = Math.max(Number(product.quantity || 0), 0);

    if (!productId || quantity <= 0) return;

    quantityByProductId.set(
      productId,
      (quantityByProductId.get(productId) || 0) + quantity
    );
  });

  if (quantityByProductId.size === 0) {
    return;
  }

  await Product.bulkWrite(
    Array.from(quantityByProductId.entries()).map(([productId, quantity]) => ({
      updateOne: {
        filter: { _id: productId },
        update: { $inc: { stock: -quantity } },
      },
    }))
  );

  console.log("Product stock decremented for delivered order", {
    products: Array.from(quantityByProductId.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
  });
};

const normalizeAddressDetails = (addressDetails = {}) => ({
  addressLine1: String(addressDetails.addressLine1 || "").trim(),
  addressLine2: String(addressDetails.addressLine2 || "").trim(),
  landmark: String(addressDetails.landmark || "").trim(),
  city: String(addressDetails.city || "").trim(),
  state: String(addressDetails.state || "").trim(),
  postalCode: String(addressDetails.postalCode || "").trim(),
  country: String(addressDetails.country || "India").trim(),
});

const buildAddressFromDetails = (addressDetails) =>
  [
    addressDetails.addressLine1,
    addressDetails.addressLine2,
    addressDetails.landmark ? `Landmark: ${addressDetails.landmark}` : "",
    addressDetails.city,
    addressDetails.state,
    addressDetails.postalCode,
    addressDetails.country,
  ]
    .filter(Boolean)
    .join(", ");

const resolveCheckoutUserId = async (req, checkoutEmail) => {
  const authenticatedUserId = req.user?._id?.toString();
  const requestedUserId = req.body.userId?.toString();

  if (!authenticatedUserId) {
    const error = new Error("User is not authenticated");
    error.statusCode = 401;
    throw error;
  }

  if (!requestedUserId || requestedUserId === authenticatedUserId) {
    return req.user._id;
  }

  const isAdmin =
    req.user?.role === "admin" ||
    req.user?.isAdmin === true ||
    req.user?.admin === true;

  if (!isAdmin) {
    const error = new Error("Authenticated user does not match checkout user");
    error.statusCode = 403;
    throw error;
  }

  const checkoutUser = await User.findById(requestedUserId).select("email role");

  if (!checkoutUser) {
    const error = new Error("Checkout user was not found");
    error.statusCode = 404;
    throw error;
  }

  if (checkoutEmail && checkoutUser.email !== checkoutEmail) {
    const error = new Error("Checkout email does not match checkout user");
    error.statusCode = 403;
    throw error;
  }

  console.warn("Admin cookie detected during customer checkout; using request userId", {
    adminUserId: authenticatedUserId,
    checkoutUserId: requestedUserId,
  });

  return checkoutUser._id;
};

const buildOrderSnapshotFromCart = async (cartProducts = []) => {
  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    const error = new Error("Cart is empty");
    error.statusCode = 400;
    throw error;
  }

  const ids = cartProducts.map((item) => normalizeProductId(item)).filter(Boolean);
  const dbProducts = await Product.find({ _id: { $in: ids } });

  const productMap = new Map(dbProducts.map((product) => [product._id.toString(), product]));

  let amount = 0;
  let totalQuantity = 0;

  const products = cartProducts.map((item) => {
    const productId = normalizeProductId(item);
    const dbProduct = productMap.get(productId?.toString());

    if (!dbProduct) {
      const error = new Error(`Product not found: ${productId}`);
      error.statusCode = 404;
      throw error;
    }

    const quantity = Math.max(Number(item.quantity || 1), 1);
    const price = Number(dbProduct.price || dbProduct.discountedPrice || dbProduct.originalPrice || 0);

    amount += price * quantity;
    totalQuantity += quantity;

    return {
      productId: dbProduct._id,
      title: dbProduct.title,
      quantity,
      price,
      img: Array.isArray(dbProduct.img) ? dbProduct.img[0] : dbProduct.img || "",
      desc: dbProduct.desc || "",
    };
  });

  return { products, amount, totalQuantity };
};

// Do not use this for Stripe Pay Now.
// Stripe orders are created only inside webhook after successful payment.
const createOrder = asyncHandler(async (req, res) => {
  const newOrder = new Order(req.body);
  const savedOrder = await newOrder.save();

  if (!savedOrder) {
    res.status(400);
    throw new Error("Order was not created");
  }

  res.status(201).json(savedOrder);
});

// ADDED: COD order creation.
// COD is allowed to create the order immediately because payment is collected later.
const createCODOrder = asyncHandler(async (req, res) => {
  const {
    cart,
    name,
    email,
    phone,
    address,
    addressDetails,
    shippingFee = 0,
    locationType = "",
  } = req.body;
  const userId = await resolveCheckoutUserId(req, email);
  const normalizedAddressDetails = normalizeAddressDetails(addressDetails);
  const fullAddress = String(address || buildAddressFromDetails(normalizedAddressDetails)).trim();

  if (!userId) {
    res.status(401);
    throw new Error("User is not authenticated");
  }

  if (!name || !email || !phone || !fullAddress) {
    res.status(400);
    throw new Error("Name, email, phone, and address are required");
  }

  const { products, amount, totalQuantity } = await buildOrderSnapshotFromCart(cart?.products);
  const safeShippingFee = Number(shippingFee || 0);
  const totalAmount = amount + safeShippingFee;
  const codReferenceId = `COD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const payment = await Payment.create({
    userId,
    products,
    amount,
    shippingFee: safeShippingFee,
    totalAmount,
    payment_status: "pending",
    status: "pending",
    status_of_transaction: "unpaid",
    mode_of_transaction: "COD",
    transactionId: codReferenceId,
    transaction_id: codReferenceId,
    customer: { name, email, phone },
    shippingAddress: {
      fullAddress,
      ...normalizedAddressDetails,
      locationType,
    },
  });

  const order = await Order.create({
    name,
    userId,
    products,
    amount,
    subtotal: amount,
    shippingFee: safeShippingFee,
    totalAmount,
    total: totalAmount,
    totalQuantity,
    address: fullAddress,
    addressDetails: normalizedAddressDetails,
    phone,
    email,
    paymentId: payment._id,
    payment_status: "pending",
    status_of_transaction: "unpaid",
    mode_of_transaction: "COD",
    transactionId: codReferenceId,
    transaction_id: codReferenceId,
    order_status: "Placed",
    delivery_status: "Placed",
    locationType,
  });

  payment.orderId = order._id;
  await payment.save();

  await sendInngestEventSafely({
    name: "order.placed",
    data: {
      email: order.email,
      name: order.name,
      orderId: order._id.toString(),
      products: order.products,
      totalAmount: order.totalAmount,
      paymentMode: order.mode_of_transaction,
      paymentStatus: order.payment_status,
      address: order.address,
    },
  });
  console.log("order.placed email event sent");

  res.status(201).json({ message: "COD order placed successfully", order });
});

const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const nextDeliveryStatus = req.body.delivery_status || order.delivery_status;
  const isDelivered = nextDeliveryStatus?.toLowerCase() === "delivered";
  const isCOD = order.mode_of_transaction === "COD";
  const oldDeliveryStatus = normalizeStatus(order.delivery_status);
  const oldOrderStatus = normalizeStatus(order.order_status);

  if (
    (oldDeliveryStatus === "cancelled" || oldOrderStatus === "cancelled") &&
    normalizeStatus(nextDeliveryStatus) !== "cancelled"
  ) {
    res.status(400);
    throw new Error("A cancelled order cannot be returned to fulfillment");
  }

  if (isDelivered && isCOD) {
    req.body.status_of_transaction = "paid";
    req.body.payment_status = "success";
  }

  if (!isDelivered && isCOD) {
    req.body.status_of_transaction = "unpaid";
    req.body.payment_status = "pending";
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  ).populate("paymentId");
  const newDeliveryStatus = normalizeStatus(updatedOrder.delivery_status);
  const newOrderStatus = normalizeStatus(updatedOrder.order_status);
  const oldWasShipping =
    shippingEmailStatuses.has(oldDeliveryStatus) || shippingEmailStatuses.has(oldOrderStatus);
  const newIsShipping =
    shippingEmailStatuses.has(newDeliveryStatus) || shippingEmailStatuses.has(newOrderStatus);
  const shouldSendShippedEmail = !oldWasShipping && newIsShipping;
  const oldWasDelivered = oldDeliveryStatus === "delivered" || oldOrderStatus === "delivered";
  const newIsDelivered = newDeliveryStatus === "delivered" || newOrderStatus === "delivered";
  const shouldHandleDeliveredTransition = !oldWasDelivered && newIsDelivered;

  if (isDelivered && isCOD && updatedOrder.paymentId) {
    await Payment.findByIdAndUpdate(updatedOrder.paymentId._id || updatedOrder.paymentId, {
      $set: {
        status_of_transaction: "paid",
        payment_status: "success",
        status: "completed",
      },
    });
  }

  if (!isDelivered && isCOD && updatedOrder.paymentId) {
    await Payment.findByIdAndUpdate(updatedOrder.paymentId._id || updatedOrder.paymentId, {
      $set: {
        status_of_transaction: "unpaid",
        payment_status: "pending",
        status: "pending",
      },
    });
  }

  if (shouldSendShippedEmail) {
    await sendInngestEventSafely({
      name: "order.shipped",
      data: {
        email: updatedOrder.email,
        name: updatedOrder.name,
        orderId: updatedOrder._id.toString(),
        products: updatedOrder.products,
        deliveryStatus: updatedOrder.delivery_status || updatedOrder.order_status,
        address: updatedOrder.address,
      },
    });
    console.log("order.shipped email event sent");
  }

  if (shouldHandleDeliveredTransition) {
    await decrementProductStockForDeliveredOrder(updatedOrder.products);

    await sendInngestEventSafely({
      name: "order.delivered",
      data: {
        email: updatedOrder.email,
        name: updatedOrder.name,
        orderId: updatedOrder._id.toString(),
        products: updatedOrder.products,
        totalAmount: updatedOrder.totalAmount,
      },
    });
    console.log("order.delivered email event sent");
  }

  res.status(200).json(updatedOrder);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const selectedReason = String(req.body.reason || "").trim();
  const otherReason = String(req.body.otherReason || "").trim();

  if (!cancellationReasons.has(selectedReason)) {
    res.status(400);
    throw new Error("Please select a valid cancellation reason");
  }

  if (selectedReason === "Other" && !otherReason) {
    res.status(400);
    throw new Error("Please provide a cancellation reason");
  }

  const cancellationReason =
    selectedReason === "Other" ? otherReason.slice(0, 300) : selectedReason;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only cancel your own orders");
  }

  const currentStatus = normalizeStatus(
    order.delivery_status || order.order_status
  );

  if (!cancellableOrderStatuses.has(currentStatus)) {
    res.status(400);
    throw new Error(
      currentStatus === "cancelled"
        ? "This order has already been cancelled"
        : "This order can no longer be cancelled"
    );
  }

  const isPaidOnlineOrder =
    order.mode_of_transaction !== "COD" &&
    (normalizeStatus(order.status_of_transaction) === "paid" ||
      normalizeStatus(order.payment_status) === "success");
  const cancelledAt = new Date();
  const cancellationUpdates = {
    order_status: "Cancelled",
    delivery_status: "Cancelled",
    cancellationReason,
    cancelledAt,
    cancelledBy: "customer",
  };

  if (isPaidOnlineOrder) {
    cancellationUpdates.refundStatus = "pending";
    cancellationUpdates.refundRequestedAt = cancelledAt;
    cancellationUpdates.refundDeadlineAt = new Date(
      cancelledAt.getTime() + 24 * 60 * 60 * 1000
    );
    cancellationUpdates.refundFailureReason = "";
  }

  const cancelledOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      userId: req.user._id,
      delivery_status: { $in: ["Placed", "Processing"] },
    },
    {
      $set: cancellationUpdates,
    },
    { new: true }
  );

  if (!cancelledOrder) {
    res.status(409);
    throw new Error("Order status changed and can no longer be cancelled");
  }

  if (cancelledOrder.mode_of_transaction === "COD" && cancelledOrder.paymentId) {
    await Payment.findByIdAndUpdate(cancelledOrder.paymentId, {
      $set: {
        payment_status: "cancelled",
        status: "cancelled",
        status_of_transaction: "unpaid",
      },
    });
  } else if (isPaidOnlineOrder && cancelledOrder.paymentId) {
    await Payment.findByIdAndUpdate(cancelledOrder.paymentId, {
      $set: {
        refundStatus: "pending",
        refundRequestedAt: cancelledAt,
        refundDeadlineAt: cancellationUpdates.refundDeadlineAt,
        refundFailureReason: "",
      },
    });
  }

  res.status(200).json({
    message: "Order cancelled successfully",
    order: cancelledOrder,
  });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order was not deleted successfully");
  }

  res.status(200).json(order);
});

const getUserOrder = asyncHandler(async (req, res) => {
  const requestedUserId = req.params.id;
  const loggedInUserId = req.user?._id?.toString();
  const isAdmin =
    req.user?.role === "admin" ||
    req.user?.isAdmin === true ||
    req.user?.admin === true;

  if (!loggedInUserId) {
    res.status(401);
    throw new Error("User is not authenticated");
  }

  if (!isAdmin && requestedUserId !== loggedInUserId) {
    console.warn("Blocked order lookup for different user", {
      requestedUserId,
      loggedInUserId,
    });
    res.status(403);
    throw new Error("You can only view your own orders");
  }

  const userId = isAdmin ? requestedUserId : loggedInUserId;


  const orders = await Order.find({
    userId,
    payment_status: { $nin: ["failed", "cancelled", "incomplete"] },
    $or: [
      { mode_of_transaction: "COD" },
      { status_of_transaction: "paid" },
      { status_of_transaction: "refunded" },
      { payment_status: { $in: ["success", "refunded"] } },
    ],
  }).sort({ createdAt: -1 });


  res.set("Cache-Control", "no-store");
  res.status(200).json(orders);
});

const getAllOrders = asyncHandler(async (req, res) => {

  const orders = await Order.find().populate("paymentId").sort({ createdAt: -1 });

  res.status(200).json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("paymentId");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.status(200).json(order);
});

export {
  getAllOrders,
  getUserOrder,
  deleteOrder,
  createOrder,
  createCODOrder,
  updateOrder,
  getOrderById,
  cancelOrder,
};
