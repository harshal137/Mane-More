import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { getShippingFeeForLocation } from "../utils/shippingSettings.js";
import protect from "../Middleware/auth.middleware.js";
import adminAuth from "../Middleware/adminAuth.middleware.js";
import { sendInngestEventSafely } from "../utils/sendInngestEventSafely.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const STRIPE_CURRENCY = "gbp";

const normalizeProductId = (item) => item.productId || item._id;

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

const getCheckoutPaymentMethodTypes = () => {
  const configuredTypes = process.env.STRIPE_PAYMENT_METHOD_TYPES;

  if (configuredTypes) {
    return configuredTypes
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);
  }

  // Stripe does not support "netbanking" as a Checkout payment_method_types value.
  // GBP Checkout works with card by default. Add more methods through
  // STRIPE_PAYMENT_METHOD_TYPES only if Stripe supports them for GBP.
  return ["card"];
};

const STRIPE_FAILURE_REASON_LABELS = {
  card_declined: "Card declined",
  generic_decline: "Card declined",
  insufficient_funds: "Insufficient funds",
  lost_card: "Lost card",
  stolen_card: "Stolen card",
  authentication_required: "Authentication required",
  expired_card: "Card expired",
  incorrect_cvc: "Incorrect CVC",
  processing_error: "Stripe processing error",
};

const getStripeFailureReason = (stripeObject = {}, fallback = "Payment failed") => {
  const stripeError = stripeObject.last_payment_error || stripeObject.error || {};
  const declineCode = stripeError.decline_code || stripeObject.decline_code;
  const errorCode = stripeError.code || stripeObject.code;
  const mappedReason =
    STRIPE_FAILURE_REASON_LABELS[declineCode] || STRIPE_FAILURE_REASON_LABELS[errorCode];

  if (mappedReason && stripeError.message) {
    return `${mappedReason}: ${stripeError.message}`;
  }

  return mappedReason || stripeError.message || stripeObject.failure_message || fallback;
};

const isAdminUser = (user) =>
  user?.role === "admin" || user?.isAdmin === true || user?.admin === true;

const normalizeRefundStatus = (status) => {
  if (status === "succeeded") return "succeeded";
  if (status === "failed" || status === "canceled") return "failed";
  return "processing";
};

const syncRefundToRecords = async (refund) => {
  const paymentIntentId =
    typeof refund.payment_intent === "string" ? refund.payment_intent : "";
  const orderId = refund.metadata?.orderId;
  const refundStatus = normalizeRefundStatus(refund.status);
  const refundAmount = Number(refund.amount || 0) / 100;
  const refundedAt = refundStatus === "succeeded" ? new Date() : null;
  const refundFailureReason =
    refundStatus === "failed"
      ? refund.failure_reason || "Stripe could not complete the refund"
      : "";
  const sharedUpdates = {
    refundStatus,
    refundId: refund.id,
    refundAmount,
    refundCurrency: String(refund.currency || "").toUpperCase(),
    refundedAt,
    refundFailureReason,
  };

  const orderFilter = orderId
    ? { _id: orderId }
    : {
        $or: [
          { stripePaymentIntentId: paymentIntentId },
          { stripe_payment_intent_id: paymentIntentId },
        ],
      };
  const paymentFilter = {
    $or: [
      { stripePaymentIntentId: paymentIntentId },
      { stripe_payment_intent_id: paymentIntentId },
    ],
  };
  const successUpdates =
    refundStatus === "succeeded"
      ? {
          payment_status: "refunded",
          status_of_transaction: "refunded",
        }
      : {};

  await Promise.all([
    Order.findOneAndUpdate(orderFilter, {
      $set: { ...sharedUpdates, ...successUpdates },
    }),
    Payment.findOneAndUpdate(paymentFilter, {
      $set: {
        ...sharedUpdates,
        ...successUpdates,
        ...(refundStatus === "succeeded" ? { status: "refunded" } : {}),
      },
    }),
  ]);

  return { refundStatus, refundAmount };
};

const markPaymentFailed = async ({
  payment,
  reason,
  eventType,
  rawStatusDetails,
  stripePaymentIntentId,
  transactionId,
}) => {
  if (!payment) return null;

  if (payment.orderId && payment.status_of_transaction === "paid") {
    return payment;
  }

  const safeReason = reason || "Payment failed";
  const safeTransactionId = transactionId || stripePaymentIntentId || payment.transactionId;

  payment.payment_status = "failed";
  payment.status = "failed";
  payment.status_of_transaction = "unpaid";
  payment.failureReason = safeReason;
  payment.failure_reason = safeReason;
  payment.stripeEventType = eventType;
  payment.rawStatusDetails = rawStatusDetails;

  if (stripePaymentIntentId) {
    payment.stripePaymentIntentId = stripePaymentIntentId;
    payment.stripe_payment_intent_id = stripePaymentIntentId;
  }

  if (safeTransactionId) {
    payment.transactionId = safeTransactionId;
    payment.transaction_id = safeTransactionId;
  }

  await payment.save();

  if (payment.orderId) {
    const orderId = payment.orderId?._id || payment.orderId;

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        payment_status: "failed",
        status_of_transaction: "unpaid",
        failureReason: safeReason,
        failure_reason: safeReason,
      },
    });
  }

  return payment;
};

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

  if (!isAdminUser(req.user)) {
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

  console.warn("Admin cookie detected during Stripe checkout; using request userId", {
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
    const requestedSize = String(item.selectedSize || "").trim();
    const sizeOptions = Array.isArray(dbProduct.sizes) ? dbProduct.sizes : [];
    const selectedSize = requestedSize
      ? sizeOptions.find((size) => size.label === requestedSize)
      : sizeOptions.find((size) => size?.label && !Number.isNaN(Number(size.price)));

    if (requestedSize && !selectedSize) {
      const error = new Error(`Selected size is no longer available for ${dbProduct.title}`);
      error.statusCode = 400;
      throw error;
    }

    const price = Number(
      selectedSize?.price ?? dbProduct.price ?? dbProduct.discountedPrice ?? dbProduct.originalPrice ?? 0
    );

    amount += price * quantity;
    totalQuantity += quantity;

    return {
      productId: dbProduct._id,
      title: dbProduct.title,
      quantity,
      price,
      selectedSize: selectedSize?.label || "",
      img: Array.isArray(dbProduct.img) ? dbProduct.img[0] : dbProduct.img || "",
      desc: dbProduct.desc || "",
    };
  });

  return { products, amount, totalQuantity };
};

const createPaidStripeOrder = async ({ session, eventType }) => {
  const payment = await Payment.findOne({
    $or: [{ stripeSessionId: session.id }, { stripe_session_id: session.id }],
  });

  if (!payment) return null;

  // ADDED: idempotency guard. If Stripe sends webhook more than once, do not duplicate order.
  const existingOrder = await Order.findOne({
    $or: [{ stripeSessionId: session.id }, { stripe_session_id: session.id }],
  });

  if (existingOrder) {
    payment.orderId = existingOrder._id;
    await payment.save();
    return existingOrder;
  }

  if (session.payment_status !== "paid") {
    payment.payment_status = "pending";
    payment.status = "pending";
    payment.status_of_transaction = "unpaid";
    payment.stripeEventType = eventType;
    payment.rawStatusDetails = session;
    await payment.save();
    return null;
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
  const transactionId = paymentIntentId || session.id;

  payment.payment_status = "success";
  payment.status = "completed";
  payment.status_of_transaction = "paid";
  payment.mode_of_transaction = "Stripe";
  payment.transactionId = transactionId;
  payment.transaction_id = transactionId;
  payment.stripePaymentIntentId = paymentIntentId;
  payment.stripe_payment_intent_id = paymentIntentId;
  payment.stripeEventType = eventType;
  payment.rawStatusDetails = session;
  await payment.save();

  const order = await Order.create({
    name: payment.customer.name,
    userId: payment.userId,
    products: payment.products,
    amount: payment.amount,
    subtotal: payment.amount,
    shippingFee: payment.shippingFee,
    totalAmount: payment.totalAmount,
    total: payment.totalAmount,
    totalQuantity: payment.products.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    address: payment.shippingAddress.fullAddress,
    addressDetails: {
      addressLine1: payment.shippingAddress.addressLine1 || "",
      addressLine2: payment.shippingAddress.addressLine2 || "",
      landmark: payment.shippingAddress.landmark || "",
      city: payment.shippingAddress.city || "",
      state: payment.shippingAddress.state || "",
      postalCode: payment.shippingAddress.postalCode || "",
      country: payment.shippingAddress.country || "India",
    },
    phone: payment.customer.phone,
    email: payment.customer.email,
    paymentId: payment._id,
    payment_status: "success",
    status_of_transaction: "paid",
    mode_of_transaction: "Stripe",
    transactionId,
    transaction_id: transactionId,
    stripeSessionId: session.id,
    stripe_session_id: session.id,
    stripePaymentIntentId: paymentIntentId,
    stripe_payment_intent_id: paymentIntentId,
    order_status: "Placed",
    delivery_status: "Placed",
    locationType: payment.shippingAddress.locationType,
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

  return order;
};

// Payment starts here.
// Frontend calls this API when user clicks Pay Online.
// IMPORTANT: This creates only Payment, not Order.
router.post("/create-checkout-session", protect, express.json(), async (req, res) => {
  try {
    const {
      cart,
      name,
      email,
      phone,
      address,
      addressDetails,
      locationType = "",
    } = req.body;
    const userId = await resolveCheckoutUserId(req, email);
    const normalizedAddressDetails = normalizeAddressDetails(addressDetails);
    const fullAddress = String(address || buildAddressFromDetails(normalizedAddressDetails)).trim();

    if (!userId) return res.status(401).json({ message: "User is not authenticated" });
    if (!name || !email || !phone || !fullAddress) {
      return res.status(400).json({ message: "Name, email, phone, and address are required" });
    }

    // SECURITY FIX: amount is recalculated from DB. Frontend amount is ignored.
    const { products, amount } = await buildOrderSnapshotFromCart(cart?.products);
    const safeShippingFee = await getShippingFeeForLocation(locationType);
    const totalAmount = amount + safeShippingFee;

    const line_items = products.map((product) => ({
      price_data: {
        currency: STRIPE_CURRENCY,
        product_data: {
          name: product.title,
          images: product.img ? [product.img] : [],
          description: product.desc || product.title,
          metadata: { productId: product.productId.toString() },
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity,
    }));

    if (safeShippingFee > 0) {
      line_items.push({
        price_data: {
          currency: STRIPE_CURRENCY,
          product_data: { name: `Shipping - ${locationType || "Delivery"}` },
          unit_amount: Math.round(safeShippingFee * 100),
        },
        quantity: 1,
      });
    }

    const payment = await Payment.create({
      userId,
      products,
      amount,
      shippingFee: safeShippingFee,
      totalAmount,
      currency: STRIPE_CURRENCY,
      payment_status: "pending",
      status: "initiated",
      status_of_transaction: "unpaid",
      mode_of_transaction: "Stripe",
      customer: { name, email, phone },
      shippingAddress: {
        fullAddress,
        ...normalizedAddressDetails,
        locationType,
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      adaptive_pricing: { enabled: false },
      payment_method_types: getCheckoutPaymentMethodTypes(),
      customer_email: email,
      line_items,
      metadata: {
        paymentId: payment._id.toString(),
        userId: userId.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/myorders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart?payment=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    payment.stripeSessionId = session.id;
    payment.stripe_session_id = session.id;
    payment.status = "pending";
    await payment.save();

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Stripe checkout session failed",
    });
  }
});

// Frontend uses this after Stripe redirects to /myorders.
// If the webhook has not arrived yet, this reconciles with Stripe and creates
// the paid order idempotently after Stripe confirms the session is paid.
router.get("/session-status/:sessionId", protect, async (req, res) => {
  try {
    let payment = await Payment.findOne({
      $or: [{ stripeSessionId: req.params.sessionId }, { stripe_session_id: req.params.sessionId }],
    }).populate("orderId");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const canAccessPayment =
      isAdminUser(req.user) ||
      payment.userId?.toString() === req.user?._id?.toString();

    if (!canAccessPayment) {
      return res.status(403).json({ message: "Access denied for this payment" });
    }

    if (!payment.orderId) {
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

      if (session.payment_status === "paid") {
        await createPaidStripeOrder({
          session,
          eventType: "session-status-reconciliation",
        });

        payment = await Payment.findById(payment._id).populate("orderId");
      } else if (session.status === "expired") {
        payment = await markPaymentFailed({
          payment,
          reason: "Checkout session expired or customer did not complete payment",
          eventType: "session-status-reconciliation",
          rawStatusDetails: session,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : "",
          transactionId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
        });
      }
    }

    return res.status(200).json({
      payment_status: payment.payment_status,
      status: payment.status,
      status_of_transaction: payment.status_of_transaction,
      orderCreated: Boolean(payment.orderId),
      orderId: payment.orderId?._id || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch payment status" });
  }
});

router.post("/cancel-session/:sessionId", protect, express.json(), async (req, res) => {
  try {
    const payment = await Payment.findOne({
      $or: [{ stripeSessionId: req.params.sessionId }, { stripe_session_id: req.params.sessionId }],
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const canAccessPayment =
      isAdminUser(req.user) ||
      payment.userId?.toString() === req.user?._id?.toString();

    if (!canAccessPayment) {
      return res.status(403).json({ message: "Access denied for this payment" });
    }

    if (payment.payment_status === "success" || payment.status_of_transaction === "paid") {
      return res.status(200).json({
        message: "Payment already completed",
        payment,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const stripePaymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : "";

    const failedPayment = await markPaymentFailed({
      payment,
      reason: "Customer cancelled payment from Stripe Checkout",
      eventType: "checkout.customer_cancelled",
      rawStatusDetails: session,
      stripePaymentIntentId,
      transactionId: stripePaymentIntentId || session.id,
    });

    return res.status(200).json({
      message: "Payment marked as failed because checkout was cancelled",
      payment: failedPayment,
    });
  } catch (error) {
    console.error("Stripe cancel checkout error:", error);
    return res.status(500).json({ message: "Could not update cancelled payment" });
  }
});

router.post(
  "/refund-order/:orderId",
  protect,
  adminAuth,
  express.json(),
  async (req, res) => {
    let lockedOrder;

    try {
      const order = await Order.findById(req.params.orderId).populate("paymentId");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const isCancelled =
        String(order.delivery_status || order.order_status).toLowerCase() ===
        "cancelled";
      const isPaidOnline =
        order.mode_of_transaction !== "COD" &&
        (order.status_of_transaction === "paid" ||
          order.payment_status === "success");

      if (!isCancelled || !isPaidOnline) {
        return res.status(400).json({
          message: "Only cancelled, paid online orders can be refunded",
        });
      }

      if (order.refundStatus === "succeeded") {
        return res.status(200).json({
          message: "This order has already been refunded",
          order,
        });
      }

      if (order.refundStatus === "processing") {
        return res.status(409).json({
          message: "A refund is already being processed for this order",
        });
      }

      const paymentIntentId =
        order.stripePaymentIntentId ||
        order.stripe_payment_intent_id ||
        order.paymentId?.stripePaymentIntentId ||
        order.paymentId?.stripe_payment_intent_id;

      if (!paymentIntentId) {
        return res.status(400).json({
          message: "Stripe PaymentIntent ID is missing for this order",
        });
      }

      lockedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          refundStatus: { $nin: ["processing", "succeeded"] },
        },
        {
          $set: {
            refundStatus: "processing",
            refundFailureReason: "",
          },
        },
        { new: true }
      );

      if (!lockedOrder) {
        return res.status(409).json({
          message: "A refund is already being processed for this order",
        });
      }

      await Payment.findByIdAndUpdate(order.paymentId?._id || order.paymentId, {
        $set: {
          refundStatus: "processing",
          refundFailureReason: "",
        },
      });

      const refund = await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            orderId: order._id.toString(),
            paymentId: (order.paymentId?._id || order.paymentId).toString(),
          },
        },
        {
          idempotencyKey: `order-refund-${order._id}`,
        }
      );
      const { refundStatus, refundAmount } = await syncRefundToRecords(refund);
      const updatedOrder = await Order.findById(order._id).populate("paymentId");

      return res.status(200).json({
        message:
          refundStatus === "succeeded"
            ? "Refund issued successfully"
            : "Refund submitted to Stripe and is processing",
        refundStatus,
        refundAmount,
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Stripe refund error:", error);

      if (lockedOrder) {
        const failureReason =
          error.raw?.message || error.message || "Stripe refund failed";

        await Promise.all([
          Order.findByIdAndUpdate(lockedOrder._id, {
            $set: {
              refundStatus: "failed",
              refundFailureReason: failureReason,
            },
          }),
          Payment.findByIdAndUpdate(lockedOrder.paymentId, {
            $set: {
              refundStatus: "failed",
              refundFailureReason: failureReason,
            },
          }),
        ]);
      }

      return res.status(error.statusCode || 500).json({
        message: error.message || "Could not refund this order",
      });
    }
  }
);

// Stripe webhook confirms payment here.
// This is the source of truth.
// IMPORTANT in server.js/app.js: mount this route before express.json(), or use raw body only for this route.
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        await createPaidStripeOrder({ session, eventType: event.type });
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const payment = await Payment.findOne({
          $or: [{ stripeSessionId: session.id }, { stripe_session_id: session.id }],
        });

        if (payment) {
          await markPaymentFailed({
            payment,
            reason: getStripeFailureReason(session, "Async payment failed"),
            eventType: event.type,
            rawStatusDetails: session,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : "",
            transactionId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        let payment = await Payment.findOne({
          $or: [
            { stripePaymentIntentId: paymentIntent.id },
            { stripe_payment_intent_id: paymentIntent.id },
          ],
        });

        if (!payment) {
          try {
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: paymentIntent.id,
              limit: 1,
            });
            const sessionId = sessions.data?.[0]?.id;

            if (sessionId) {
              payment = await Payment.findOne({
                $or: [{ stripeSessionId: sessionId }, { stripe_session_id: sessionId }],
              });
            }
          } catch (lookupError) {
            console.warn("Could not link failed payment intent to checkout session:", lookupError.message);
          }
        }

        if (payment) {
          await markPaymentFailed({
            payment,
            reason: getStripeFailureReason(paymentIntent, "Payment failed"),
            eventType: event.type,
            rawStatusDetails: paymentIntent,
            stripePaymentIntentId: paymentIntent.id,
            transactionId: paymentIntent.id,
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const payment = await Payment.findOne({
          $or: [{ stripeSessionId: session.id }, { stripe_session_id: session.id }],
        });

        if (payment && !payment.orderId) {
          await markPaymentFailed({
            payment,
            reason: "Checkout session expired or customer did not complete payment",
            eventType: event.type,
            rawStatusDetails: session,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : "",
            transactionId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          });
        }
        break;
      }

      case "refund.created":
      case "refund.updated":
      case "refund.failed": {
        await syncRefundToRecords(event.data.object);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handling error:", error);
    return res.status(500).json({ message: "Webhook handling failed" });
  }
});

export default router;
