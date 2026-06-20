import {
  FaMinus,
  FaPlus,
  FaTrashAlt,
  FaArrowLeft,
  FaShoppingBag,
  FaCreditCard,
  FaBox,
  FaInfoCircle,
  FaTimes,
  FaSpinner,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCity,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, removeProduct, updateQuantity } from "../redux/cartRedux";
import { stripeRequest, userRequest } from "../requestMethods";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  trackPageView,
  trackButtonClick,
  trackUserAction,
  trackPurchase,
} from "../utils/analytics";

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

/** Manages cart contents, delivery details, and checkout initiation. */
const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [shippingCharges, setShippingCharges] = useState({
    withinLondon: 2,
    outsideLondon: 4,
  });
  const [shippingChargesLoading, setShippingChargesLoading] = useState(true);

  const [orderDetails, setOrderDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    payNow: false,
    paymentMethod: "",
    pickupOption: "delivery",
    locationType: "",
  });

  useEffect(() => {
    const loadShippingCharges = async () => {
      try {
        const { data } = await userRequest.get("/shipping");
        setShippingCharges({
          withinLondon: Number(data.withinLondon),
          outsideLondon: Number(data.outsideLondon),
        });
      } catch (error) {
        console.error("Could not load shipping charges:", error);
        toast.error("Could not refresh shipping charges. Please reload the page.");
      } finally {
        setShippingChargesLoading(false);
      }
    };

    loadShippingCharges();
  }, []);

  useEffect(() => {
    trackPageView("cart_page");
    trackButtonClick("cart_view", {
      cart_items_count: cart.products?.length || 0,
      cart_total: cart.total || 0,
      cart_quantity: cart.quantity || 0,
      user_logged_in: !!user.currentUser,
    });
  }, []);

  useEffect(() => {
    if (cart.products?.length > 0) {
      trackUserAction("cart_updated", "cart_update", {
        cart_items_count: cart.products.length,
        cart_total: cart.total,
        cart_quantity: cart.quantity,
      });
    }
  }, [cart.products, cart.total, cart.quantity]);

  useEffect(() => {
    if (showOrderModal) {
      requestAnimationFrame(() => setIsModalVisible(true));
    } else {
      setIsModalVisible(false);
    }
  }, [showOrderModal]);

  // ADDED: show message when user returns from Stripe cancel/failure.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (payment === "cancelled") {
      if (sessionId) {
        stripeRequest
          .post(`/cancel-session/${sessionId}`)
          .catch((error) => {
            console.error("Could not mark cancelled Stripe payment:", error);
          });
      }

      toast.error("Payment was cancelled. Your order was not placed.");
      navigate("/cart", { replace: true });
    }

    if (payment === "failed") {
      toast.error("Payment failed. Your order was not placed.");
      navigate("/cart", { replace: true });
    }
  }, [navigate]);

  const calculateShippingFee = () => {
    switch (orderDetails.locationType) {
      case "Within London":
        return shippingCharges.withinLondon;
      case "Outside London":
        return shippingCharges.outsideLondon;
      default:
        return 0;
    }
  };

  const subtotal = cart.total || 0;
  const shippingFee = calculateShippingFee();
  const total = subtotal + shippingFee;

  const validatePhoneNumber = (phone) => {
    const cleanedPhone = phone.replace(/\D/g, "");

    if (!cleanedPhone) {
      return { isValid: false, message: "Phone number is required" };
    }

    if (cleanedPhone.length < 10) {
      return { isValid: false, message: "Please enter a valid phone number" };
    }

    return { isValid: true, formatted: cleanedPhone };
  };

  const resetOrderDetails = () => {
    setOrderDetails({
      name: "",
      phone: "",
      email: "",
      address: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      payNow: false,
      paymentMethod: "",
      pickupOption: "delivery",
      locationType: "",
    });
  };

  const buildAddressDetails = () => ({
    addressLine1: orderDetails.addressLine1.trim(),
    addressLine2: orderDetails.addressLine2.trim(),
    landmark: orderDetails.landmark.trim(),
    city: orderDetails.city.trim(),
    state: orderDetails.state.trim(),
    postalCode: orderDetails.postalCode.trim(),
    country: orderDetails.country.trim() || "India",
  });

  const buildFullAddress = () => {
    const details = buildAddressDetails();

    return [
      details.addressLine1,
      details.addressLine2,
      details.landmark ? `Landmark: ${details.landmark}` : "",
      details.city,
      details.state,
      details.postalCode,
      details.country,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const handleRemoveProduct = (product) => {
    dispatch(removeProduct(product));
    toast.success("Item removed from cart");
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.info("Cart cleared");
  };

  const handleQuantityChange = (product, change) => {
    const newQuantity = product.quantity + change;

    if (newQuantity < 1) {
      handleRemoveProduct(product);
      return;
    }

    dispatch(
      updateQuantity({
        _id: product._id,
        selectedSize: product.selectedSize || null,
        quantity: newQuantity,
      })
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");
      const validation = validatePhoneNumber(numbersOnly);

      setPhoneError(validation.isValid ? "" : validation.message);

      setOrderDetails((prev) => ({
        ...prev,
        phone: numbersOnly,
      }));

      return;
    }

    setOrderDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationTypeChange = (location) => {
    setOrderDetails((prev) => ({
      ...prev,
      locationType: location,
    }));
  };

  const handleProceedToCheckout = async () => {
    if (!user.currentUser) {
      toast.error("Please login to place an order");
      return;
    }

    setShippingChargesLoading(true);
    try {
      const { data } = await userRequest.get("/shipping");
      setShippingCharges({
        withinLondon: Number(data.withinLondon),
        outsideLondon: Number(data.outsideLondon),
      });
    } catch (error) {
      console.error("Could not refresh shipping charges:", error);
      toast.error("Could not refresh shipping charges. Please try again.");
      return;
    } finally {
      setShippingChargesLoading(false);
    }

    setModalStep(1);
    setShowOrderModal(true);
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setIsModalVisible(false);

      setTimeout(() => {
        setShowOrderModal(false);
        setModalStep(1);
        resetOrderDetails();
        setPhoneError("");
      }, 300);
    }
  };

  const handlePaymentChoice = (payNow, paymentMethod) => {
    setOrderDetails((prev) => ({
      ...prev,
      payNow,
      paymentMethod,
    }));

    setModalStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!orderDetails.locationType) {
      toast.error("Please select your delivery area");
      return;
    }

    const phoneValidation = validatePhoneNumber(orderDetails.phone);

    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.message);
      return;
    }

    const addressDetails = buildAddressDetails();
    const fullAddress = buildFullAddress();

    if (
      !orderDetails.name.trim() ||
      !orderDetails.phone ||
      !addressDetails.addressLine1 ||
      !addressDetails.addressLine2 ||
      !addressDetails.city ||
      !addressDetails.state ||
      !addressDetails.postalCode ||
      !fullAddress
    ) {
      toast.error("Please fill in all required details");
      return;
    }

    setIsProcessing(true);

    try {
      const formattedPhone = phoneValidation.formatted;
      const commonPayload = {
        userId: user.currentUser._id,
        cart,
        name: orderDetails.name,
        email: orderDetails.email || user.currentUser.email,
        phone: formattedPhone.toString(),
        address: fullAddress,
        addressDetails,
        locationType: orderDetails.locationType,
      };

      if (orderDetails.payNow) {
        // UPDATED: Pay Online only creates a Stripe Checkout Session.
        // Order is NOT created here. Final paid order is created by Stripe webhook.
        // Frontend total/amount is intentionally not sent because backend recalculates it from DB.
        const stripeResponse = await stripeRequest.post(
          "/create-checkout-session",
          commonPayload
        );

        if (stripeResponse.data?.url) {
          // IMPORTANT: do not clear cart here.
          // Cart is cleared only after webhook creates the paid order and My Orders verifies it.
          window.location.href = stripeResponse.data.url;
          return;
        }

        throw new Error("Stripe checkout URL not received");
      }

      // ADDED: COD order flow.
      // COD creates order immediately with payment_status pending and transaction mode COD.
      const codResponse = await userRequest.post("/orders/cod", commonPayload);

      if (codResponse.data?.order) {
        dispatch(clearCart());
        trackPurchase(codResponse.data.order._id, total, cart.products);
        navigate("/myorders?order=cod-success");
        return;
      }

      throw new Error("COD order was not created");
    } catch (error) {
      console.error("Order/payment error:", error);
      toast.error(
        error.response?.data?.message ||
          "Order could not be processed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const inputStyle = {
    backgroundColor: THEME.BG,
    border: `1px solid ${THEME.BORDER}`,
    color: THEME.TEXT,
  };

  const selectedCard = {
    backgroundColor: THEME.SOFT_GREEN,
    border: `2px solid ${THEME.PRIMARY}`,
    color: THEME.PRIMARY,
  };

  const normalCard = {
    backgroundColor: THEME.CARD,
    border: `2px solid ${THEME.BORDER}`,
    color: THEME.TEXT,
  };

  const renderModalContent = () => {
    if (modalStep === 1) {
      return (
        <div>
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: THEME.SOFT_GREEN }}
            >
              <FaCreditCard className="h-7 w-7" style={{ color: THEME.PRIMARY }} />
            </div>

            <h3 className="mb-3 text-2xl font-bold" style={{ color: THEME.HEADING }}>
              Choose Payment Method
            </h3>

            <p className="mb-6 text-sm" style={{ color: THEME.TEXT }}>
              Select how you want to pay for this order.
            </p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => handlePaymentChoice(false, "Cash On Delivery")}
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 font-semibold transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: THEME.CARD,
                color: THEME.PRIMARY,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <span className="flex items-center">
                <FaBox className="mr-3" />
                Cash On Delivery
              </span>
              <span> £ {total.toLocaleString("en-US")}</span>
            </button>

            <button
              onClick={() => handlePaymentChoice(true, "Stripe")}
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 font-semibold transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
                boxShadow: "0 12px 25px rgba(74,49,95,0.22)",
              }}
            >
              <span className="flex items-center">
                <FaCreditCard className="mr-3" />
                Pay Online
              </span>
              <span> £ {total.toLocaleString("en-US")} </span>
            </button>
          </div>

          <div
            className="mt-6 rounded-2xl p-4 text-left"
            style={{
              backgroundColor: "rgba(239,198,90,0.20)",
              border: `1px solid rgba(239,198,90,0.45)`,
            }}
          >
            <div className="flex items-start">
              <FaInfoCircle
                className="mt-1 mr-3 flex-shrink-0"
                style={{ color: THEME.PRIMARY }}
              />
              <p className="text-xs leading-relaxed" style={{ color: THEME.TEXT }}>
                Cash On Delivery orders stay unpaid until delivered. Stripe orders
                will be marked paid after payment confirmation.
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="mt-5 w-full rounded-xl px-5 py-3 font-semibold transition-all duration-300"
            style={{
              backgroundColor: THEME.BG,
              color: THEME.TEXT,
              border: `1px solid ${THEME.BORDER}`,
            }}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setModalStep(1)}
            className="flex items-center text-sm font-semibold"
            style={{ color: THEME.PRIMARY }}
            disabled={isProcessing}
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>

          <h3 className="text-xl font-bold" style={{ color: THEME.HEADING }}>
            Checkout Details
          </h3>

          <button
            onClick={handleCloseModal}
            className="transition-transform duration-200 hover:scale-110"
            style={{ color: THEME.MUTED }}
            disabled={isProcessing}
          >
            <FaTimes />
          </button>
        </div>

        <div
          className="mb-6 rounded-2xl p-4"
          style={{
            backgroundColor: orderDetails.payNow
              ? THEME.SOFT_GREEN
              : "rgba(239,198,90,0.18)",
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <div className="flex items-center">
            {orderDetails.payNow ? <FaCreditCard /> : <FaBox />}

            <span className="ml-2 font-semibold" style={{ color: THEME.PRIMARY }}>
              {orderDetails.paymentMethod}
            </span>

            <span className="ml-auto font-bold" style={{ color: THEME.HEADING }}>
              £ {total.toLocaleString("en-US")}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="mb-3 font-semibold" style={{ color: THEME.HEADING }}>
            Delivery Area
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleLocationTypeChange("Within London")}
              className="rounded-2xl p-4 text-center transition-all duration-300"
              style={
                orderDetails.locationType === "Within London"
                  ? selectedCard
                  : normalCard
              }
            >
              <span className="font-semibold">Within London</span>
              <p className="mt-1 text-xs">
                £ {shippingCharges.withinLondon.toLocaleString("en-US")} Shipping
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleLocationTypeChange("Outside London")}
              className="rounded-2xl p-4 text-center transition-all duration-300"
              style={
                orderDetails.locationType === "Outside London"
                  ? selectedCard
                  : normalCard
              }
            >
              <span className="font-semibold">Outside London</span>
              <p className="mt-1 text-xs">
                £ {shippingCharges.outsideLondon.toLocaleString("en-US")} Shipping
              </p>
            </button>
          </div>
        </div>

        <div
          className="mb-6 rounded-3xl p-5"
          style={{
            backgroundColor: THEME.CARD,
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <h4
            className="mb-4 flex items-center font-semibold"
            style={{ color: THEME.HEADING }}
          >
            <FaMapMarkerAlt className="mr-2" style={{ color: THEME.PRIMARY }} />
            Address & Contact Details
          </h4>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                Full Name *
              </label>

              <div className="relative">
                <FaUser className="absolute left-4 top-3.5 text-sm" style={{ color: THEME.MUTED }} />

                <input
                  type="text"
                  name="name"
                  value={orderDetails.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl py-3 pl-10 pr-4 outline-none"
                  style={inputStyle}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                Phone Number *
              </label>

              <div className="relative">
                <FaPhone className="absolute left-4 top-3.5 text-sm" style={{ color: THEME.MUTED }} />

                <input
                  type="tel"
                  name="phone"
                  value={orderDetails.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl py-3 pl-10 pr-4 outline-none"
                  style={{
                    ...inputStyle,
                    border: phoneError ? "1px solid #EF4444" : inputStyle.border,
                  }}
                  placeholder="Enter phone number"
                  inputMode="numeric"
                />
              </div>

              {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                Email Address
              </label>

              <div className="relative">
                <FaEnvelope className="absolute left-4 top-3.5 text-sm" style={{ color: THEME.MUTED }} />

                <input
                  type="email"
                  name="email"
                  value={orderDetails.email}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl py-3 pl-10 pr-4 outline-none"
                  style={inputStyle}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                House / Building / Flat *
              </label>

              <input
                type="text"
                name="addressLine1"
                value={orderDetails.addressLine1}
                onChange={handleInputChange}
                className="w-full rounded-2xl px-4 py-3 outline-none"
                style={inputStyle}
                placeholder="Flat no, building, house name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                Street / Area / Society *
              </label>

              <input
                type="text"
                name="addressLine2"
                value={orderDetails.addressLine2}
                onChange={handleInputChange}
                className="w-full rounded-2xl px-4 py-3 outline-none"
                style={inputStyle}
                placeholder="Street, area, society or locality"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                Landmark
              </label>

              <input
                type="text"
                name="landmark"
                value={orderDetails.landmark}
                onChange={handleInputChange}
                className="w-full rounded-2xl px-4 py-3 outline-none"
                style={inputStyle}
                placeholder="Nearby landmark"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                  City *
                </label>

                <div className="relative">
                  <FaCity className="absolute left-4 top-3.5 text-sm" style={{ color: THEME.MUTED }} />

                  <input
                    type="text"
                    name="city"
                    value={orderDetails.city}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl py-3 pl-10 pr-4 outline-none"
                    style={inputStyle}
                    placeholder="City"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                  State *
                </label>

                <input
                  type="text"
                  name="state"
                  value={orderDetails.state}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle}
                  placeholder="State"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                  PIN Code *
                </label>

                <input
                  type="text"
                  name="postalCode"
                  value={orderDetails.postalCode}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle}
                  placeholder="PIN code"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
                  Country *
                </label>

                <input
                  type="text"
                  name="country"
                  value={orderDetails.country}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl p-5"
          style={{
            backgroundColor: THEME.BG,
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <h4 className="mb-4 font-semibold" style={{ color: THEME.HEADING }}>
            Order Summary
          </h4>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between" style={{ color: THEME.TEXT }}>
              <span>Items ({cart.quantity})</span>
              <span> £{subtotal.toLocaleString("en-US")}</span>
            </div>

            <div className="flex justify-between" style={{ color: THEME.TEXT }}>
              <span>Shipping</span>
              <span>
                {shippingFee === 0
                  ? "Select area"
                  : `£ ${shippingFee.toLocaleString("en-US")}`}
              </span>
            </div>

            <div
              className="flex justify-between border-t pt-3 text-lg font-bold"
              style={{
                borderColor: THEME.BORDER,
                color: THEME.HEADING,
              }}
            >
              <span>Total</span>
              <span style={{ color: THEME.PRIMARY }}>
                £ {total.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handlePlaceOrder}
            disabled={
              isProcessing ||
              phoneError ||
              !orderDetails.locationType ||
              !orderDetails.paymentMethod
            }
            className="flex w-full items-center justify-center rounded-2xl px-5 py-4 font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: THEME.PRIMARY,
              color: "#FFFFFF",
              boxShadow: "0 12px 25px rgba(74,49,95,0.20)",
            }}
          >
            {isProcessing ? (
              <>
                <FaSpinner className="mr-2 animate-spin" />
                Processing...
              </>
            ) : orderDetails.payNow ? (
              <>
                <FaCreditCard className="mr-2" />
                Pay Online, £ {total.toLocaleString("en-US")}
              </>
            ) : (
              <>
                <FaBox className="mr-2" />
                Place COD Order
              </>
            )}
          </button>

          <button
            onClick={handleCloseModal}
            disabled={isProcessing}
            className="w-full rounded-2xl px-5 py-3 font-semibold transition-all duration-300"
            style={{
              backgroundColor: THEME.BG,
              color: THEME.TEXT,
              border: `1px solid ${THEME.BORDER}`,
            }}
          >
            Cancel
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className="min-h-screen px-4 pb-10 pt-24 sm:px-6 lg:px-8"
      style={{ backgroundColor: THEME.BG }}
    >
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      {showOrderModal && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center p-4 transition-all duration-300 ${isModalVisible ? "opacity-100" : "opacity-0"
            }`}
        >
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${isModalVisible ? "opacity-50" : "opacity-0"
              }`}
            onClick={handleCloseModal}
          />

          <div
            className={`relative max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transition-all duration-300 ${isModalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              } ${modalStep === 1 ? "w-full max-w-md" : "w-full max-w-2xl"}`}
            style={{
              backgroundColor: THEME.CARD,
              border: `1px solid ${THEME.BORDER}`,
            }}
          >
            <div className="p-6">{renderModalContent()}</div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Link
            to="/"
            className="flex items-center font-semibold transition-colors"
            style={{ color: THEME.PRIMARY }}
          >
            <FaArrowLeft className="mr-2" />
            Continue Shopping
          </Link>

          <h1 className="text-3xl font-bold" style={{ color: THEME.HEADING }}>
            Your Shopping Bag
          </h1>

          {cart.products?.length > 0 && (
            <span
              className="ml-auto rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: THEME.SOFT_GREEN,
                color: THEME.PRIMARY,
              }}
            >
              {cart.quantity} {cart.quantity === 1 ? "Item" : "Items"}
            </span>
          )}
        </div>

        {cart.products?.length === 0 ? (
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
              <FaShoppingBag className="h-12 w-12" style={{ color: THEME.PRIMARY }} />
            </div>

            <h2 className="mb-4 text-2xl font-bold" style={{ color: THEME.HEADING }}>
              Your bag is empty
            </h2>

            <p className="mx-auto mb-8 max-w-md" style={{ color: THEME.TEXT }}>
              Looks like you have not added any products to your bag yet. Start
              exploring our collection.
            </p>

            <Link
              to="/#premium-collection"
              className="inline-block rounded-full px-8 py-3 font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
              }}
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            <div
              className="flex-1 rounded-3xl p-6"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
                boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
              }}
            >
              <div
                className="mb-6 flex items-center justify-between border-b pb-4"
                style={{ borderColor: THEME.BORDER }}
              >
                <h3 className="text-xl font-semibold" style={{ color: THEME.HEADING }}>
                  Your Items
                </h3>

                <button
                  onClick={handleClearCart}
                  className="flex items-center text-sm font-semibold"
                  style={{ color: THEME.PRIMARY }}
                >
                  <FaTrashAlt className="mr-2" />
                  Clear Bag
                </button>
              </div>

              <div className="space-y-6">
                {cart.products?.map((product, index) => (
                  <div
                    key={`${product._id}-${product.selectedSize || "default"}-${index}`}
                    className="flex flex-col gap-6 border-b pb-6 last:border-0 sm:flex-row"
                    style={{ borderColor: THEME.BORDER }}
                  >
                    <img
                      src={Array.isArray(product.img) ? product.img[0] : product.img}
                      alt={product.title}
                      className="h-28 w-full rounded-2xl object-cover shadow-sm sm:w-28"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between gap-4">
                        <h3
                          className="mb-1 text-lg font-semibold"
                          style={{ color: THEME.HEADING }}
                        >
                          {product.title}
                        </h3>

                        <button
                          onClick={() => handleRemoveProduct(product)}
                          className="p-2"
                          style={{ color: THEME.MUTED }}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>

                      <p className="mb-4 line-clamp-2 text-sm" style={{ color: THEME.TEXT }}>
                        {product.desc}
                      </p>

                      {product.selectedSize && (
                        <p className="mb-4 text-sm font-semibold" style={{ color: THEME.PRIMARY }}>
                          Size / Length: {product.selectedSize} - {"\u00a3"}
                          {Number(product.selectedSizePrice || product.price).toFixed(2)}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center rounded-full p-1"
                          style={{ backgroundColor: THEME.BG }}
                        >
                          <button
                            onClick={() => handleQuantityChange(product, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ color: THEME.PRIMARY }}
                          >
                            <FaMinus className="text-xs" />
                          </button>

                          <span
                            className="mx-3 w-6 text-center font-semibold"
                            style={{ color: THEME.HEADING }}
                          >
                            {product.quantity}
                          </span>

                          <button
                            onClick={() => handleQuantityChange(product, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ color: THEME.PRIMARY }}
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: THEME.PRIMARY }}>
                            £ {((product.price * product.quantity).toLocaleString("en-US"))}
                          </p>

                          {product.quantity > 1 && (
                            <p className="text-xs" style={{ color: THEME.MUTED }}>
                              £ {product.price.toLocaleString("en-US")} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-96">
              <div
                className="sticky top-28 rounded-3xl p-6"
                style={{
                  backgroundColor: THEME.CARD,
                  border: `1px solid ${THEME.BORDER}`,
                  boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
                }}
              >
                <h2
                  className="mb-6 border-b pb-4 text-xl font-semibold"
                  style={{
                    color: THEME.HEADING,
                    borderColor: THEME.BORDER,
                  }}
                >
                  Order Summary
                </h2>

                <div className="mb-6 space-y-4">
                  <div className="flex justify-between" style={{ color: THEME.TEXT }}>
                    <span>Subtotal ({cart.quantity} items)</span>
                    <span className="font-semibold"> £ {subtotal.toLocaleString("en-US")}</span>
                  </div>

                  <div className="flex justify-between" style={{ color: THEME.TEXT }}>
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shippingChargesLoading ? "Loading rates..." : "Select at checkout"}
                    </span>
                  </div>

                  <div
                    className="rounded-2xl p-4 text-sm"
                    style={{
                      backgroundColor: THEME.SOFT_GREEN,
                      color: THEME.PRIMARY,
                    }}
                  >
                    <strong>Shipping Options</strong>
                    {shippingChargesLoading ? (
                      <p className="mt-2 text-xs">Loading current rates...</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>
                          Delivery within London: £{" "}
                          {shippingCharges.withinLondon.toLocaleString("en-US")}
                        </li>
                        <li>
                          Delivery outside London: £{" "}
                          {shippingCharges.outsideLondon.toLocaleString("en-US")}
                        </li>
                      </ul>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  disabled={shippingChargesLoading}
                  className="mb-4 flex w-full items-center justify-center rounded-full px-6 py-4 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: THEME.PRIMARY,
                    color: "#FFFFFF",
                    boxShadow: "0 12px 25px rgba(74,49,95,0.22)",
                  }}
                >
                  {shippingChargesLoading ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Loading Shipping Rates...
                    </>
                  ) : (
                    <>
                      <FaBox className="mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </button>

                {!user.currentUser && (
                  <p className="mt-4 text-center text-sm" style={{ color: THEME.MUTED }}>
                    <Link
                      to="/login"
                      className="font-semibold"
                      style={{ color: THEME.PRIMARY }}
                    >
                      Sign in
                    </Link>{" "}
                    to place your order
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
