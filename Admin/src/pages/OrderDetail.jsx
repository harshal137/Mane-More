import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { userRequest } from "../requestMethods";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCreditCard,
  FaEnvelope,
  FaExternalLinkAlt,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaTruck,
  FaUser,
  FaUndo,
} from "react-icons/fa";

const THEME = {
  BG: "#F8F5F1",
  CARD: "#FFFFFF",
  PRIMARY: "#4A315F",
  HEADING: "#111827",
  TEXT: "#5F5A6E",
  MUTED: "#7A7488",
  BORDER: "#E8E1DA",
  SOFT_GREEN: "#E8F1D8",
};

const OrderDetail = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState("Placed");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    const getOrder = async () => {
      try {
        setLocationData(null);
        const res = await userRequest.get("/orders/findorder/" + id);
        setOrder(res.data);
        setDeliveryStatus(res.data.delivery_status || "Placed");
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    getOrder();
  }, [id]);

  const formatCurrency = (amount) => {
    return `£${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString();
  };

  const getProductImage = (product) => {
    if (Array.isArray(product.img)) return product.img[0];
    return product.img;
  };

  const getAddressDetails = () => order?.addressDetails || {};

  const buildDeliveryAddress = () => {
    const details = getAddressDetails();
    const parts = [
      details.addressLine1,
      details.addressLine2,
      details.landmark ? `Landmark: ${details.landmark}` : "",
      details.city,
      details.state,
      details.postalCode,
      details.country,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : order?.address || "";
  };

  const mapsLink = buildDeliveryAddress()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        buildDeliveryAddress()
      )}`
    : "";

  const generateLocationDetails = async () => {
    const address = buildDeliveryAddress();

    if (!address) {
      alert("Address is not available for this order");
      return;
    }

    setLocationLoading(true);

    try {
      const params = new URLSearchParams({
        format: "json",
        q: address,
        limit: "1",
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      const data = await res.json();
      const match = Array.isArray(data) ? data[0] : null;

      setLocationData({
        address,
        mapsLink,
        lat: match?.lat || "",
        lon: match?.lon || "",
        displayName: match?.display_name || "",
      });

      if (!match) {
        alert("Coordinates were not found. You can still open the map link by address.");
      }
    } catch (error) {
      console.log(error);
      setLocationData({
        address,
        mapsLink,
        lat: "",
        lon: "",
        displayName: "",
      });
      alert("Could not generate coordinates. You can still open the map link by address.");
    } finally {
      setLocationLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    try {
      setUpdating(true);

      const res = await userRequest.put(`/orders/${order._id}`, {
        delivery_status: deliveryStatus,
      });

      setOrder(res.data);
      setDeliveryStatus(res.data.delivery_status || deliveryStatus);

      /*
        EMAIL SENDING OPTION FOR LATER

        await userRequest.post("/email/order-status", {
          email: res.data.email,
          name: res.data.name,
          orderId: res.data._id,
          delivery_status: res.data.delivery_status,
        });
      */

      alert("Order status updated successfully");
    } catch (error) {
      console.log(error);
      alert("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const deliverySteps = [
    { label: "Ordered", value: "Placed" },
    { label: "Processing", value: "Processing" },
    { label: "Shipped", value: "Shipped" },
    { label: "Delivered", value: "Delivered" },
  ];

  const getDeliveryLabel = (status) => {
    const match = deliverySteps.find(
      (step) => step.value.toLowerCase() === (status || "").toLowerCase()
    );

    return match?.label || status || "Ordered";
  };

  const refundOrder = async () => {
    const confirmed = window.confirm(
      `Refund ${formatCurrency(order.totalAmount || order.total)} to the customer's original payment method?`
    );

    if (!confirmed) return;

    try {
      setRefunding(true);
      const res = await userRequest.post(`/stripe/refund-order/${order._id}`);
      setOrder(res.data.order || order);
      alert(res.data.message || "Refund submitted successfully");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to refund this order");
    } finally {
      setRefunding(false);
    }
  };

  const currentStepIndex = deliverySteps.findIndex(
    (step) => step.value.toLowerCase() === deliveryStatus.toLowerCase()
  );
  const isCancelled =
    String(order?.delivery_status || order?.order_status).toLowerCase() ===
    "cancelled";
  const isPaidOnline =
    order?.mode_of_transaction !== "COD" &&
    (order?.status_of_transaction === "paid" ||
      order?.payment_status === "success");
  const canRefund =
    isCancelled &&
    isPaidOnline &&
    !["processing", "succeeded"].includes(order?.refundStatus);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: THEME.BG }}
      >
        <p style={{ color: THEME.TEXT }}>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: THEME.BG }}
      >
        <p style={{ color: THEME.TEXT }}>Order not found</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8"
      style={{ backgroundColor: THEME.BG }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <Link
          to="/orders"
          className="mb-6 inline-flex items-center gap-2 font-semibold"
          style={{ color: THEME.PRIMARY }}
        >
          <FaArrowLeft />
          Back to Orders
        </Link>

        {/* Header */}
        <div
          className="mb-8 rounded-3xl p-6"
          style={{
            backgroundColor: THEME.CARD,
            border: `1px solid ${THEME.BORDER}`,
            boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                Order #{order._id?.slice(-8).toUpperCase()}
              </h1>

              <p className="mt-2" style={{ color: THEME.TEXT }}>
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <span
              className="w-fit rounded-full px-5 py-2 text-sm font-semibold"
              style={{
                backgroundColor: isCancelled ? "#FEE2E2" : THEME.SOFT_GREEN,
                color: isCancelled ? "#B91C1C" : THEME.PRIMARY,
              }}
            >
              {getDeliveryLabel(order.delivery_status)}
            </span>
          </div>
        </div>

        {isCancelled && (
          <div
            className="mb-8 rounded-3xl p-6"
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
            }}
          >
            <h2 className="text-xl font-bold" style={{ color: "#991B1B" }}>
              Order Cancelled
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#991B1B" }}>
              <strong>Reason:</strong>{" "}
              {order.cancellationReason || "No reason recorded"}
            </p>
            <p className="mt-1 text-sm" style={{ color: "#991B1B" }}>
              <strong>Cancelled at:</strong> {formatDate(order.cancelledAt)}
            </p>

            {order.mode_of_transaction !== "COD" && (
              <div
                className="mt-5 rounded-2xl p-4"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #FECACA" }}
              >
                <p className="font-semibold" style={{ color: THEME.HEADING }}>
                  Refund status:{" "}
                  <span className="capitalize">
                    {(order.refundStatus || "pending").replace("_", " ")}
                  </span>
                </p>
                <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                  Admin action deadline: {formatDate(order.refundDeadlineAt)}
                </p>
                <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                  Stripe sends the refund to the original payment method. The
                  customer&apos;s bank typically posts it in 5-10 business days.
                </p>

                {order.refundFailureReason && (
                  <p className="mt-2 text-sm font-semibold text-red-700">
                    {order.refundFailureReason}
                  </p>
                )}

                {canRefund && (
                  <button
                    type="button"
                    onClick={refundOrder}
                    disabled={refunding}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <FaUndo />
                    {refunding ? "Refunding..." : "Refund Full Amount"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Update */}
        <div
          className="mb-8 rounded-3xl p-6"
          style={{
            backgroundColor: THEME.CARD,
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <h2
            className="mb-5 text-xl font-bold"
            style={{ color: THEME.HEADING }}
          >
            Order Processing Status
          </h2>

          <div className="mb-6 grid grid-cols-4 gap-3">
            {deliverySteps.map((step, index) => {
              const active = index <= currentStepIndex;

              return (
                <div key={step.value} className="text-center">
                  <div
                    className="mb-2 h-2 rounded-full"
                    style={{
                      backgroundColor: active ? THEME.PRIMARY : THEME.BORDER,
                    }}
                  />
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: active ? THEME.PRIMARY : THEME.MUTED,
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                className="mb-2 block text-sm font-semibold"
                style={{ color: THEME.HEADING }}
              >
                Change Delivery Status
              </label>

              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                disabled={isCancelled}
                className="w-full rounded-2xl px-4 py-3 outline-none"
                style={{
                  backgroundColor: THEME.BG,
                  border: `1px solid ${THEME.BORDER}`,
                  color: THEME.TEXT,
                }}
              >
                <option value="Placed">Ordered</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={updateOrderStatus}
              disabled={updating || isCancelled}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold disabled:opacity-60"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
              }}
            >
              <FaSave />
              {isCancelled
                ? "Order Cancelled"
                : updating
                  ? "Updating..."
                  : "Save Status"}
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-8 lg:col-span-2">
            {/* Customer Details */}
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <h2
                className="mb-5 flex items-center gap-2 text-xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                <FaUser style={{ color: THEME.PRIMARY }} />
                Customer Details
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info label="Customer Name" value={order.name} />
                <Info label="User ID" value={order.userId} />
                <Info label="Email" value={order.email} icon={<FaEnvelope />} />
                <Info label="Phone" value={order.phone} icon={<FaPhone />} />
              </div>
            </div>

            {/* Address */}
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <h2
                className="mb-4 flex items-center gap-2 text-xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                <FaMapMarkerAlt style={{ color: THEME.PRIMARY }} />
                Shipping Address
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info
                  label="House / Building"
                  value={getAddressDetails().addressLine1}
                />
                <Info
                  label="Street / Area"
                  value={getAddressDetails().addressLine2}
                />
                <Info label="Landmark" value={getAddressDetails().landmark} />
                <Info label="City" value={getAddressDetails().city} />
                <Info label="State" value={getAddressDetails().state} />
                <Info label="PIN Code" value={getAddressDetails().postalCode} />
                <Info label="Country" value={getAddressDetails().country} />
                <Info label="Delivery Area" value={order.locationType} />
              </div>

              <div
                className="mt-4 rounded-2xl p-4"
                style={{
                  backgroundColor: THEME.BG,
                  border: `1px solid ${THEME.BORDER}`,
                }}
              >
                <p
                  className="mb-1 text-xs font-semibold uppercase"
                  style={{ color: THEME.MUTED }}
                >
                  Full Address
                </p>

                <p className="break-words font-semibold" style={{ color: THEME.HEADING }}>
                  {buildDeliveryAddress() || "Address not available"}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={generateLocationDetails}
                  disabled={locationLoading || !buildDeliveryAddress()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold disabled:opacity-60"
                  style={{
                    backgroundColor: THEME.PRIMARY,
                    color: "#FFFFFF",
                  }}
                >
                  <FaLocationArrow />
                  {locationLoading ? "Generating..." : "Generate Location"}
                </button>

                {mapsLink && (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold"
                    style={{
                      backgroundColor: THEME.BG,
                      border: `1px solid ${THEME.BORDER}`,
                      color: THEME.PRIMARY,
                    }}
                  >
                    <FaExternalLinkAlt />
                    Open Maps
                  </a>
                )}
              </div>

              {locationData && (
                <div
                  className="mt-5 rounded-2xl p-4"
                  style={{
                    backgroundColor: THEME.SOFT_GREEN,
                    border: `1px solid ${THEME.BORDER}`,
                    color: THEME.PRIMARY,
                  }}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Info label="Latitude" value={locationData.lat || "Not found"} />
                    <Info label="Longitude" value={locationData.lon || "Not found"} />
                  </div>

                  {locationData.displayName && (
                    <p className="mt-3 text-sm leading-relaxed">
                      {locationData.displayName}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Products */}
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <h2
                className="mb-5 flex items-center gap-2 text-xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                <FaBoxOpen style={{ color: THEME.PRIMARY }} />
                Products
              </h2>

              <div className="space-y-4">
                {order.products?.map((product, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4 rounded-2xl p-4 sm:flex-row"
                    style={{
                      backgroundColor: THEME.BG,
                      border: `1px solid ${THEME.BORDER}`,
                    }}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="h-24 w-full rounded-xl object-cover sm:w-24"
                    />

                    <div className="flex-1">
                      <h3
                        className="font-bold"
                        style={{ color: THEME.HEADING }}
                      >
                        {product.title}
                      </h3>

                      <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                        Product ID: {product.productId || product._id}
                      </p>

                      <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                        Quantity: {product.quantity}
                      </p>

                      <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                        Unit Price: {formatCurrency(product.price)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p
                        className="text-lg font-bold"
                        style={{ color: THEME.PRIMARY }}
                      >
                        {formatCurrency(product.price * product.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-8">
            {/* Order Summary */}
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <h2
                className="mb-5 text-xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                Order Summary
              </h2>

              <SummaryRow label="Order ID" value={order._id} />
              <SummaryRow label="Total Quantity" value={order.totalQuantity || 0} />
              <SummaryRow label="Total Amount" value={formatCurrency(order.total)} />
              <SummaryRow label="Status Code" value={order.status} />
              <SummaryRow
                label="Delivery Status"
                value={getDeliveryLabel(order.delivery_status)}
              />
              <SummaryRow label="Created At" value={formatDate(order.createdAt)} />
              <SummaryRow label="Updated At" value={formatDate(order.updatedAt)} />
            </div>

            {/* Transaction Details */}
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <h2
                className="mb-5 flex items-center gap-2 text-xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                <FaCreditCard style={{ color: THEME.PRIMARY }} />
                Transaction Details
              </h2>

              <SummaryRow
                label="Mode"
                value={order.mode_of_transaction || "Not available"}
              />
              <SummaryRow
                label="Transaction Status"
                value={order.status_of_transaction || "Not available"}
              />
              <SummaryRow
                label="Transaction ID"
                value={order.transaction_id || "Not available"}
              />
              <SummaryRow
                label="Refund Status"
                value={(order.refundStatus || "not_required").replace("_", " ")}
              />
              {order.refundId && (
                <SummaryRow label="Stripe Refund ID" value={order.refundId} />
              )}
              {order.refundAmount > 0 && (
                <SummaryRow
                  label="Refund Amount"
                  value={formatCurrency(order.refundAmount)}
                />
              )}
            </div>

            {/* Admin Notes */}
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: THEME.SOFT_GREEN,
                color: THEME.PRIMARY,
              }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-bold">
                <FaTruck />
                Admin Processing
              </h2>

              <p className="text-sm leading-relaxed">
                Update the order status as the order moves from processing to
                shipped and then delivered. Email notification logic is already
                marked in comments inside the update function.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, icon }) => {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: THEME.BG,
        border: `1px solid ${THEME.BORDER}`,
      }}
    >
      <p
        className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase"
        style={{ color: THEME.MUTED }}
      >
        {icon}
        {label}
      </p>

      <p className="break-words font-semibold" style={{ color: THEME.HEADING }}>
        {value || "Not available"}
      </p>
    </div>
  );
};

const SummaryRow = ({ label, value }) => {
  return (
    <div
      className="flex justify-between gap-4 border-b py-3 text-sm last:border-b-0"
      style={{ borderColor: THEME.BORDER }}
    >
      <span style={{ color: THEME.TEXT }}>{label}</span>
      <span
        className="max-w-[180px] break-words text-right font-semibold"
        style={{ color: THEME.HEADING }}
      >
        {value || "Not available"}
      </span>
    </div>
  );
};

export default OrderDetail;
