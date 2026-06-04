import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";

dotenv.config();

const repairOrders = async () => {
  const orders = await Order.find({}).select("_id userId email paymentId").lean();
  let updatedOrders = 0;
  let updatedPayments = 0;

  for (const order of orders) {
    if (!order.email) continue;

    const customer = await User.findOne({ email: order.email }).select("_id email").lean();
    if (!customer) continue;

    if (order.userId?.toString() !== customer._id.toString()) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { userId: customer._id } }
      );
      updatedOrders += 1;
      console.log(`Order ${order._id} userId repaired to ${customer._id}`);
    }

    if (order.paymentId) {
      const result = await Payment.updateOne(
        { _id: order.paymentId, userId: { $ne: customer._id } },
        { $set: { userId: customer._id } }
      );
      updatedPayments += result.modifiedCount || 0;
    }
  }

  const payments = await Payment.find({}).select("_id userId customer.email").lean();

  for (const payment of payments) {
    const email = payment.customer?.email;
    if (!email) continue;

    const customer = await User.findOne({ email }).select("_id email").lean();
    if (!customer) continue;

    if (payment.userId?.toString() !== customer._id.toString()) {
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { userId: customer._id } }
      );
      updatedPayments += 1;
      console.log(`Payment ${payment._id} userId repaired to ${customer._id}`);
    }
  }

  return { updatedOrders, updatedPayments };
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const result = await repairOrders();
  await mongoose.disconnect();

  console.log("Repair complete", result);
};

run().catch(async (error) => {
  console.error("Repair failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
