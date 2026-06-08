import mongoose from "mongoose";

const ProductSnapshotSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    img: { type: String, default: "" },
    desc: { type: String, default: "" },
  },
  { _id: false }
);

const PaymentSchema = mongoose.Schema(
  {
    // ADDED/UPDATED: linked user and final order reference
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

    // ADDED/UPDATED: cart snapshot at payment attempt time
    products: { type: [ProductSnapshotSchema], required: true },
    amount: { type: Number, required: true }, // subtotal before shipping
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "usd" },

    // ADDED/UPDATED: normalized payment states
    payment_status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "incomplete", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "completed",
        "failed",
        "cancelled",
        "pending",
        "incomplete",
        "refunded",
      ],
      default: "initiated",
    },
    status_of_transaction: {
      type: String,
      enum: ["paid", "unpaid", "refunded"],
      default: "unpaid",
    },
    mode_of_transaction: {
      type: String,
      enum: ["Stripe", "Card", "Online", "COD"],
      default: "Stripe",
    },

    // ADDED/UPDATED: transaction identifiers
    transactionId: { type: String, default: "" },
    stripeSessionId: { type: String, default: undefined },
    stripePaymentIntentId: { type: String, default: "" },

    // Backward-compatible aliases for your existing UI/admin code
    transaction_id: { type: String, default: "" },
    stripe_session_id: { type: String, default: undefined },
    stripe_payment_intent_id: { type: String, default: "" },

    // ADDED/UPDATED: customer and shipping details
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      fullAddress: { type: String, required: true },
      addressLine1: { type: String, default: "" },
      addressLine2: { type: String, default: "" },
      landmark: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "India" },
      locationType: { type: String, default: "" },
    },

    failureReason: { type: String, default: "" },
    failure_reason: { type: String, default: "" },
    stripeEventType: { type: String, default: "" },
    rawStatusDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
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

PaymentSchema.index(
  { stripeSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      stripeSessionId: { $exists: true, $type: "string" },
    },
  }
);

PaymentSchema.index(
  { stripe_session_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      stripe_session_id: { $exists: true, $type: "string" },
    },
  }
);

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
