import asyncHandler from "express-async-handler";
import ShippingSetting from "../models/shippingSetting.model.js";
import { getShippingSettings } from "../utils/shippingSettings.js";

export const getShippingCharges = asyncHandler(async (_req, res) => {
  res.status(200).json(await getShippingSettings());
});

export const updateShippingCharges = asyncHandler(async (req, res) => {
  const withinLondon = Number(req.body.withinLondon);
  const outsideLondon = Number(req.body.outsideLondon);

  if (
    !Number.isFinite(withinLondon) ||
    !Number.isFinite(outsideLondon) ||
    withinLondon < 0 ||
    outsideLondon < 0
  ) {
    res.status(400);
    throw new Error("Shipping charges must be valid non-negative numbers");
  }

  const settings = await ShippingSetting.findOneAndUpdate(
    { key: "default" },
    { $set: { withinLondon, outsideLondon } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    withinLondon: settings.withinLondon,
    outsideLondon: settings.outsideLondon,
    updatedAt: settings.updatedAt,
  });
});
