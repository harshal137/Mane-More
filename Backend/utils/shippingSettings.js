import ShippingSetting from "../models/shippingSetting.model.js";

export const DEFAULT_SHIPPING_CHARGES = {
  withinLondon: 2,
  outsideLondon: 4,
};

export const getShippingSettings = async () => {
  const settings = await ShippingSetting.findOne({ key: "default" }).lean();

  return {
    withinLondon: Number(settings?.withinLondon ?? DEFAULT_SHIPPING_CHARGES.withinLondon),
    outsideLondon: Number(settings?.outsideLondon ?? DEFAULT_SHIPPING_CHARGES.outsideLondon),
    updatedAt: settings?.updatedAt || null,
  };
};

export const getShippingFeeForLocation = async (locationType) => {
  const settings = await getShippingSettings();

  if (locationType === "Within London") return settings.withinLondon;
  if (locationType === "Outside London") return settings.outsideLondon;

  const error = new Error("Please select a valid delivery area");
  error.statusCode = 400;
  throw error;
};
