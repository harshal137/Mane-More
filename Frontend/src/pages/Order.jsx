import {
  FaShoppingBag,
  FaTruck,
  FaCreditCard,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { userRequest, stripeRequest } from "../requestMethods";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../redux/cartRedux";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const THEME = {
  BG: "#F8F5F1",
  CARD: "#FFFFFF",
  PRIMARY: "#4A315F",
  GOLD: "#EFC65A",
  HEADING: "#111827",
  TEXT: "#5F5A6E",
  MUTED: "#7A7488",
  BORDER: "#E8E1DA",
  SOFT_GREEN: "#E8F1D8",
};

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Need to change delivery address",
  "Delivery is taking too long",
  "Changed my mind",
  "Other",
];

const Order = () => {
  const user = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fetchUserOrders = useCallback(async () => {
    try {
      if (!user.currentUser?._id) return;

      const res = await userRequest.get(`/orders/find/${user.currentUser._id}`);
      setOrders(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [user.currentUser?._id]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  const sessionId = params.get("session_id");
  const orderStatus = params.get("order");

  if (orderStatus === "cod-success") {
    toast.success("COD order placed successfully. Your order is now visible.");
    fetchUserOrders();
    navigate("/myorders", { replace: true });
    return;
  }

  if (paymentStatus === "success" && sessionId) {
    let tries = 0;

    const verifyStripeOrder = async () => {
      try {
        tries += 1;

        // ADDED: verify that webhook has created the order before clearing cart.
        const res = await stripeRequest.get(`/session-status/${sessionId}`);

        if (res.data?.orderCreated && res.data?.payment_status === "success") {
          dispatch(clearCart());
          await fetchUserOrders();
          toast.success("Payment successful. Your order has been placed.");
          navigate("/myorders", { replace: true });
          return;
        }

        if (tries < 6) {
          setTimeout(verifyStripeOrder, 1500);
          return;
        }

        toast.info("Payment received. Your order will appear after confirmation.");
        await fetchUserOrders();
        navigate("/myorders", { replace: true });
      } catch (error) {
        console.log(error);
        toast.error("Could not verify payment status. Please refresh My Orders.");
        navigate("/myorders", { replace: true });
      }
    };

    verifyStripeOrder();
  }
}, [dispatch, fetchUserOrders, navigate]);

  useEffect(() => {
    if (user.currentUser) {
      fetchUserOrders();
    }
  }, [fetchUserOrders, user.currentUser]);

  const formatCurrency = (amount) => {
    return `£ ${Number(amount || 0).toLocaleString("en-US")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentStatus = (order) => {
    if (order.refundStatus === "succeeded") return "Refunded";
    if (
      order.refundStatus === "pending" ||
      order.refundStatus === "processing"
    ) {
      return "Refund pending";
    }
    if (order.status_of_transaction) return order.status_of_transaction;
    if (order.status === 0) return "Unpaid";
    if (order.status === 1) return "Paid";
    return "Pending";
  };

  const getPaymentStyle = (status) => {
    const value = status.toLowerCase();

    if (value.includes("refund")) {
      return {
        bg: "#DBEAFE",
        color: "#2563EB",
        icon: <FaClock />,
      };
    }

    if (value.includes("paid") || value.includes("completed") || value.includes("success")) {
      return {
        bg: "#DCFCE7",
        color: "#16A34A",
        icon: <FaCheckCircle />,
      };
    }

    if (value.includes("unpaid") || value.includes("failed") || value.includes("cancel")) {
      return {
        bg: "#FEE2E2",
        color: "#DC2626",
        icon: <FaTimesCircle />,
      };
    }

    return {
      bg: "#FEF3C7",
      color: "#D97706",
      icon: <FaClock />,
    };
  };

  const getDeliveryStatus = (order) => {
    return order.delivery_status || "Placed";
  };

  const getDeliveryLabel = (status) => {
    if (!status || status.toLowerCase() === "placed") return "Ordered";
    return status;
  };

  const getDeliveryStep = (status) => {
    const value = status.toLowerCase();

    if (value.includes("cancel")) return 0;
    if (value.includes("delivered")) return 4;
    if (value.includes("shipped") || value.includes("dispatch")) return 3;
    if (value.includes("processing")) return 2;
    return 1;
  };

  const getImageSrc = (product) => {
    if (Array.isArray(product.img)) return product.img[0];
    return product.img;
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const canCancelOrder = (order) => {
    const status = getDeliveryStatus(order).toLowerCase();
    return status === "placed" || status === "processing";
  };

  const openCancellationModal = (order) => {
    setOrderToCancel(order);
    setCancellationReason("");
    setOtherReason("");
  };

  const closeCancellationModal = () => {
    if (isCancelling) return;
    setOrderToCancel(null);
    setCancellationReason("");
    setOtherReason("");
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel || !cancellationReason) return;

    if (cancellationReason === "Other" && !otherReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    try {
      setIsCancelling(true);
      const res = await userRequest.put(`/orders/${orderToCancel._id}/cancel`, {
        reason: cancellationReason,
        otherReason: otherReason.trim(),
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderToCancel._id ? res.data.order : order
        )
      );
      toast.success(res.data.message || "Order cancelled successfully.");
      setOrderToCancel(null);
      setCancellationReason("");
      setOtherReason("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not cancel this order. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8"
      style={{ backgroundColor: THEME.BG }}
    >
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold md:text-4xl"
            style={{ color: THEME.HEADING }}
          >
            My Orders
          </h1>

          <p className="mt-2" style={{ color: THEME.TEXT }}>
            Track, review, and manage your recent purchases.
          </p>
        </div>

        {orders.length === 0 ? (
          <div
            className="mx-auto max-w-2xl rounded-3xl p-12 text-center"
            style={{
              backgroundColor: THEME.CARD,
              border: `1px solid ${THEME.BORDER}`,
              boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
            }}
          >
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: THEME.SOFT_GREEN }}
            >
              <FaShoppingBag
                className="h-12 w-12"
                style={{ color: THEME.PRIMARY }}
              />
            </div>

            <h2
              className="mb-3 text-2xl font-bold"
              style={{ color: THEME.HEADING }}
            >
              No orders yet
            </h2>

            <p className="mb-8" style={{ color: THEME.TEXT }}>
              You have not placed any orders yet. Start shopping to see your
              order history here.
            </p>

            <Link
              to="/#premium-collection"
              className="inline-block rounded-full px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const paymentStatus = getPaymentStatus(order);
              const paymentStyle = getPaymentStyle(paymentStatus);
              const deliveryStatus = getDeliveryStatus(order);
              const deliveryLabel = getDeliveryLabel(deliveryStatus);
              const deliveryStep = getDeliveryStep(deliveryStatus);
              const isExpanded = expandedOrders[order._id];
              const isCancelled = deliveryStatus.toLowerCase() === "cancelled";

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-3xl"
                  style={{
                    backgroundColor: THEME.CARD,
                    border: `1px solid ${THEME.BORDER}`,
                    boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
                  }}
                >
                  {/* Amazon/Myntra style order top bar */}
                  <div
                    className="grid grid-cols-1 gap-4 border-b p-5 md:grid-cols-4"
                    style={{
                      backgroundColor: "#FAFAFA",
                      borderColor: THEME.BORDER,
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase" style={{ color: THEME.MUTED }}>
                        Order Placed
                      </p>
                      <p className="mt-1 font-semibold" style={{ color: THEME.HEADING }}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase" style={{ color: THEME.MUTED }}>
                        Total
                      </p>
                      <p className="mt-1 font-semibold" style={{ color: THEME.PRIMARY }}>
                        {formatCurrency(order.totalAmount || order.total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase" style={{ color: THEME.MUTED }}>
                        Ship To
                      </p>
                      <p className="mt-1 font-semibold" style={{ color: THEME.HEADING }}>
                        {order.name || user.currentUser?.name || "Customer"}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs font-semibold uppercase" style={{ color: THEME.MUTED }}>
                        Order ID
                      </p>
                      <p className="mt-1 font-semibold" style={{ color: THEME.HEADING }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Main order content */}
                  <div className="p-5 md:p-6">
                    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2
                          className="text-xl font-bold"
                          style={{ color: THEME.HEADING }}
                        >
                          {deliveryLabel}
                        </h2>

                        <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                          {order.products?.length || 0} item
                          {order.products?.length !== 1 ? "s" : ""} in this order
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                          style={{
                            backgroundColor: paymentStyle.bg,
                            color: paymentStyle.color,
                          }}
                        >
                          {paymentStyle.icon}
                          {paymentStatus}
                        </span>

                        <span
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                          style={{
                            backgroundColor: isCancelled ? "#FEE2E2" : THEME.SOFT_GREEN,
                            color: isCancelled ? "#DC2626" : THEME.PRIMARY,
                          }}
                        >
                          {isCancelled ? <FaTimesCircle /> : <FaTruck />}
                          {deliveryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Delivery progress */}
                    {!isCancelled && (
                      <div className="mb-6">
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                          {["Ordered", "Processing", "Shipped", "Delivered"].map(
                            (step, index) => {
                              const active = index + 1 <= deliveryStep;

                              return (
                                <div key={step}>
                                  <div
                                    className="mb-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: active
                                        ? THEME.PRIMARY
                                        : THEME.BORDER,
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: active
                                        ? THEME.PRIMARY
                                        : THEME.MUTED,
                                    }}
                                  >
                                    {step}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {isCancelled && order.cancellationReason && (
                      <div
                        className="mb-6 rounded-2xl p-4 text-sm"
                        style={{
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #FECACA",
                          color: "#991B1B",
                        }}
                      >
                        <span className="font-bold">Cancellation reason:</span>{" "}
                        {order.cancellationReason}
                      </div>
                    )}

                    {isCancelled &&
                      order.mode_of_transaction !== "COD" &&
                      order.refundStatus &&
                      order.refundStatus !== "not_required" && (
                        <div
                          className="mb-6 rounded-2xl p-4 text-sm"
                          style={{
                            backgroundColor: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            color: "#1D4ED8",
                          }}
                        >
                          <span className="font-bold">Refund status:</span>{" "}
                          {order.refundStatus === "succeeded"
                            ? "Refund issued to your original payment method."
                            : "Awaiting admin refund action. After Stripe accepts the refund, banks typically show it within 5-10 business days."}
                        </div>
                      )}

                    {/* Product preview */}
                    <div className="space-y-4">
                      {(isExpanded ? order.products : order.products?.slice(0, 2))?.map(
                        (product, index) => (
                          <div
                            key={index}
                            className="flex flex-col gap-4 rounded-2xl p-4 sm:flex-row"
                            style={{
                              backgroundColor: THEME.BG,
                              border: `1px solid ${THEME.BORDER}`,
                            }}
                          >
                            <img
                              src={getImageSrc(product)}
                              alt={product.title}
                              className="h-28 w-full rounded-xl object-cover sm:w-28"
                            />

                            <div className="flex-1">
                              <h3
                                className="font-bold"
                                style={{ color: THEME.HEADING }}
                              >
                                {product.title}
                              </h3>

                              <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                                Quantity: {product.quantity}
                              </p>

                              <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                                Price: {formatCurrency(product.price)}
                              </p>

                              <p
                                className="mt-2 text-lg font-bold"
                                style={{ color: THEME.PRIMARY }}
                              >
                                {formatCurrency(product.price * product.quantity)}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:w-40">
                              <Link
                                to={`/product/${product.productId || product._id}`}
                                className="rounded-xl px-4 py-2 text-center text-sm font-semibold"
                                style={{
                                  backgroundColor: THEME.PRIMARY,
                                  color: "#FFFFFF",
                                }}
                              >
                                View Product
                              </Link>

                              <Link
                                to="/#premium-collection"
                                className="rounded-xl px-4 py-2 text-center text-sm font-semibold"
                                style={{
                                  backgroundColor: THEME.CARD,
                                  color: THEME.PRIMARY,
                                  border: `1px solid ${THEME.BORDER}`,
                                }}
                              >
                                Buy Again
                              </Link>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {order.products?.length > 2 && (
                      <button
                        onClick={() => toggleOrderExpansion(order._id)}
                        className="mt-4 flex items-center gap-2 text-sm font-semibold"
                        style={{ color: THEME.PRIMARY }}
                      >
                        {isExpanded ? (
                          <>
                            <FaChevronUp /> Show Less Items
                          </>
                        ) : (
                          <>
                            <FaChevronDown /> Show All {order.products.length} Items
                          </>
                        )}
                      </button>
                    )}

                    {/* See All / See Less Button */}
                    <button
                      onClick={() => toggleOrderExpansion(order._id)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: THEME.CARD,
                        color: THEME.PRIMARY,
                        border: `1px solid ${THEME.BORDER}`,
                      }}
                    >
                      {isExpanded ? (
                        <>
                          <FaChevronUp />
                          See Less Details
                        </>
                      ) : (
                        <>
                          <FaChevronDown />
                          See All Details
                        </>
                      )}
                    </button>

                    {canCancelOrder(order) && (
                      <button
                        type="button"
                        onClick={() => openCancellationModal(order)}
                        className="ml-3 mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300"
                        style={{
                          backgroundColor: "#FFFFFF",
                          color: "#DC2626",
                          border: "1px solid #FCA5A5",
                        }}
                      >
                        <FaTimesCircle />
                        Cancel Order
                      </button>
                    )}

                    {/* Details panel */}
                    {isExpanded && (
                    <div
                      className="mt-6 grid grid-cols-1 gap-5 border-t pt-6 md:grid-cols-3"
                      style={{ borderColor: THEME.BORDER }}
                    >
                      <div>
                        <h4
                          className="mb-3 flex items-center gap-2 font-bold"
                          style={{ color: THEME.HEADING }}
                        >
                          <FaMapMarkerAlt style={{ color: THEME.PRIMARY }} />
                          Delivery Address
                        </h4>

                        <p className="text-sm" style={{ color: THEME.TEXT }}>
                          {order.name}
                        </p>

                        <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                          {order.address || "Address not available"}
                        </p>

                        {order.phone && (
                          <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: THEME.TEXT }}>
                            <FaPhone style={{ color: THEME.PRIMARY }} />
                            {order.phone}
                          </p>
                        )}

                        {order.email && (
                          <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: THEME.TEXT }}>
                            <FaEnvelope style={{ color: THEME.PRIMARY }} />
                            {order.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <h4
                          className="mb-3 flex items-center gap-2 font-bold"
                          style={{ color: THEME.HEADING }}
                        >
                          <FaCreditCard style={{ color: THEME.PRIMARY }} />
                          Payment Details
                        </h4>

                        <p className="mt-2 text-sm" style={{ color: THEME.TEXT }}>
                          Payment Status:{" "}
                          <span
                            className="font-semibold"
                            style={{ color: paymentStyle.color }}
                          >
                            {paymentStatus}
                          </span>
                        </p>

                        <p className="text-sm" style={{ color: THEME.TEXT }}>
                          Mode of Transaction:{" "}
                          <span className="font-semibold">
                            {order.mode_of_transaction || "Not available"}
                          </span>
                        </p>

                        <p className="mt-2 text-sm" style={{ color: THEME.TEXT }}>
                          Transaction ID:{" "}
                          <span className="font-semibold">
                            {order.transaction_id || "Not available"}
                          </span>
                        </p>
                      </div>

                      <div
                        className="rounded-2xl p-4"
                        style={{
                          backgroundColor: THEME.BG,
                          border: `1px solid ${THEME.BORDER}`,
                        }}
                      >
                        <h4
                          className="mb-3 flex items-center gap-2 font-bold"
                          style={{ color: THEME.HEADING }}
                        >
                          <FaClipboardList style={{ color: THEME.PRIMARY }} />
                          Order Summary
                        </h4>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between" style={{ color: THEME.TEXT }}>
                            <span>Items</span>
                            <span>{order.products?.length || 0}</span>
                          </div>

                          <div className="flex justify-between" style={{ color: THEME.TEXT }}>
                            <span>Total</span>
                            <span className="font-bold" style={{ color: THEME.PRIMARY }}>
                              {formatCurrency(order.totalAmount || order.total)}
                            </span>
                          </div>

                          <div className="flex justify-between" style={{ color: THEME.TEXT }}>
                            <span>Delivery</span>
                            <span>{deliveryLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              to="/#premium-collection"
              className="inline-block rounded-full px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
              }}
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>

      {orderToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCancellationModal();
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8"
            style={{
              backgroundColor: THEME.CARD,
              boxShadow: "0 24px 70px rgba(17,24,39,0.25)",
            }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="cancel-order-title"
                  className="text-2xl font-bold"
                  style={{ color: THEME.HEADING }}
                >
                  Cancel order
                </h2>
                <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                  Tell us why you want to cancel order #
                  {orderToCancel._id.slice(-8).toUpperCase()}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCancellationModal}
                disabled={isCancelling}
                className="text-2xl leading-none"
                style={{ color: THEME.MUTED }}
                aria-label="Close cancellation dialog"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                  style={{
                    borderColor:
                      cancellationReason === reason
                        ? THEME.PRIMARY
                        : THEME.BORDER,
                    backgroundColor:
                      cancellationReason === reason ? "#F7F2FA" : THEME.CARD,
                  }}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={reason}
                    checked={cancellationReason === reason}
                    onChange={(event) =>
                      setCancellationReason(event.target.value)
                    }
                    className="h-4 w-4"
                    style={{ accentColor: THEME.PRIMARY }}
                  />
                  <span className="text-sm font-medium" style={{ color: THEME.HEADING }}>
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            {cancellationReason === "Other" && (
              <textarea
                value={otherReason}
                onChange={(event) => setOtherReason(event.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Please tell us your reason"
                className="mt-4 w-full resize-none rounded-xl border p-3 text-sm outline-none"
                style={{ borderColor: THEME.BORDER, color: THEME.HEADING }}
              />
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancellationModal}
                disabled={isCancelling}
                className="rounded-full px-6 py-2.5 text-sm font-semibold"
                style={{
                  color: THEME.PRIMARY,
                  border: `1px solid ${THEME.BORDER}`,
                }}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={
                  isCancelling ||
                  !cancellationReason ||
                  (cancellationReason === "Other" && !otherReason.trim())
                }
                className="rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#DC2626" }}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
