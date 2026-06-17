import mongoose from "mongoose";

const shippingSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },
    withinLondon: { type: Number, required: true, min: 0, default: 2 },
    outsideLondon: { type: Number, required: true, min: 0, default: 4 },
  },
  { timestamps: true }
);

export default mongoose.model("ShippingSetting", shippingSettingSchema);
