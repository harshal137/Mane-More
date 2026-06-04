import dotenv from "dotenv";
import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createOrderFromPaidSession = async (payment, session) => {
  const existingOrder = await Order.findOne({
    $or: [
      { stripeSessionId: session.id },
      { stripe_session_id: session.id },
      { paymentId: payment._id },
    ],
  });

  if (existingOrder) {
    payment.orderId = existingOrder._id;
    payment.payment_status = "success";
    payment.status = "completed";
    payment.status_of_transaction = "paid";
    await payment.save();
    return existingOrder;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : "";
  const transactionId = paymentIntentId || session.id;

  payment.payment_status = "success";
  payment.status = "completed";
  payment.status_of_transaction = "paid";
  payment.mode_of_transaction = "Stripe";
  payment.transactionId = transactionId;
  payment.transaction_id = transactionId;
  payment.stripePaymentIntentId = paymentIntentId;
  payment.stripe_payment_intent_id = paymentIntentId;
  payment.stripeEventType = "manual-paid-session-repair";
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
    totalQuantity: payment.products.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    ),
    address: payment.shippingAddress.fullAddress,
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
  return order;
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const payments = await Payment.find({
    mode_of_transaction: "Stripe",
    orderId: null,
    $or: [
      { stripeSessionId: { $exists: true, $type: "string" } },
      { stripe_session_id: { $exists: true, $type: "string" } },
    ],
  });

  let repaired = 0;

  for (const payment of payments) {
    const sessionId = payment.stripeSessionId || payment.stripe_session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      console.log(`Skipping unpaid session ${sessionId}: ${session.payment_status}`);
      continue;
    }

    const order = await createOrderFromPaidSession(payment, session);
    repaired += 1;
    console.log(`Created/relinked order ${order._id} for paid session ${sessionId}`);
  }

  await mongoose.disconnect();
  console.log(`Repair complete. Paid Stripe orders repaired: ${repaired}`);
};

run().catch(async (error) => {
  console.error("Repair failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
