import mongoose from "mongoose";

const OrderProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    selectedSize: { type: String, default: "" },
    img: { type: String, default: "" },
    desc: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = mongoose.Schema(
  {
    // Existing fields kept, but structure made safer for Stripe + COD
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: { type: [OrderProductSchema], required: true },

    amount: { type: Number, required: true }, // subtotal
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // Backward-compatible fields used by your current Order.jsx
    subtotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    totalQuantity: { type: Number, default: 0 },

    address: { type: String, required: true },
    addressDetails: {
      addressLine1: { type: String, default: "" },
      addressLine2: { type: String, default: "" },
      landmark: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    locationType: { type: String, default: "" },

    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },

    payment_status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "incomplete", "refunded"],
      default: "pending",
    },
    status_of_transaction: {
      type: String,
      enum: ["paid", "unpaid", "refunded"],
      default: "unpaid",
    },
    mode_of_transaction: {
      type: String,
      enum: ["Stripe", "Card", "Online", "COD"],
      default: "COD",
    },
    transactionId: { type: String, default: "" },
    transaction_id: { type: String, default: "" },

    stripeSessionId: { type: String, default: undefined },
    stripePaymentIntentId: { type: String, default: "" },
    stripe_session_id: {
      type: String,
      default: undefined,
    },
    stripe_payment_intent_id: { type: String, default: "" },

    order_status: {
      type: String,
      enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    delivery_status: {
      type: String,
      enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    deliveryMarkedBy: {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: "" },
      markedAt: { type: Date, default: null },
    },
    cancellationReason: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "admin", ""],
      default: "",
    },
    refundStatus: {
      type: String,
      enum: ["not_required", "pending", "processing", "succeeded", "failed"],
      default: "not_required",
    },
    refundRequestedAt: { type: Date, default: null },
    refundDeadlineAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundId: { type: String, default: "" },
    refundAmount: { type: Number, default: 0 },
    refundCurrency: { type: String, default: "" },
    refundFailureReason: { type: String, default: "" },
  },
  { timestamps: true }
);

OrderSchema.index(
  { stripeSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      stripeSessionId: { $exists: true, $type: "string" },
    },
  }
);

OrderSchema.index(
  { stripe_session_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      stripe_session_id: { $exists: true, $type: "string" },
    },
  }
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;
