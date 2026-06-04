import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userRequest } from "../requestMethods";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaArrowLeft,
  FaPhone,
  FaStar,
  FaGem,
  FaHeart,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/userRedux";

const THEME = {
  BG: "#F8F5F1",
  CARD: "#FFFFFF",
  PRIMARY: "#4A315F",
  PRIMARY_DARK: "#3B284D",
  GOLD: "#EFC65A",
  HEADING: "#111827",
  TEXT: "#5F5A6E",
  MUTED: "#7A7488",
  BORDER: "#E8E1DA",
  SOFT_GREEN: "#E8F1D8",
};

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getUserData = async () => {
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();

      return {
        ipAddress: ipData.ip,
        referrer: document.referrer || "Direct",
      };
    } catch (error) {
      console.error("Error fetching user data:", error);

      return {
        ipAddress: "Unknown",
        referrer: document.referrer || "Direct",
      };
    }
  };

  const formatPhoneNumber = (value) => {
    const trimmedValue = value.trim();
    const cleaned = trimmedValue.replace(/\D/g, "");

    if (!cleaned) {
      return "";
    }

    if (trimmedValue.startsWith("+44") || cleaned.startsWith("44")) {
      return `+44${cleaned.replace(/^44/, "")}`;
    }

    if (cleaned.startsWith("0")) {
      return `+44${cleaned.slice(1)}`;
    }

    if (cleaned.length <= 10) {
      return `+44${cleaned}`;
    }

    return `+${cleaned}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password should be at least 6 characters long");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the Terms and Conditions");
      return;
    }

    try {
      setLoading(true);

      const userData = await getUserData();

      const registrationData = {
        name,
        email,
        password,
        phone: phone || undefined,
        ipAddress: userData.ipAddress,
        referrer: userData.referrer,
        registrationSource: "website",
      };

      const response = await userRequest.post("/auth/register", registrationData);

      toast.success(
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center">
            <FaStar className="mr-2" style={{ color: THEME.GOLD }} />
            <span className="font-bold">Welcome to Mane & More!</span>
          </div>
          <p className="text-sm">Your beauty journey begins now.</p>
        </div>
      );

      if (response.data) {
        dispatch(loginSuccess(response.data));

        localStorage.setItem("currentUser", JSON.stringify(response.data));

        if (response.data.accessToken) {
          localStorage.setItem("token", response.data.accessToken);
        }

        setIsTransitioning(true);

        setTimeout(() => {
          toast.success("You're all set. Taking you home...");
        }, 500);

        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: THEME.BG,
    border: `1px solid ${THEME.BORDER}`,
    color: THEME.TEXT,
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 pb-12 pt-24 transition-all duration-700 ease-in-out sm:px-6 lg:px-8 ${
        isTransitioning ? "scale-105 opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: THEME.BG }}
    >
      <div className="w-full max-w-5xl">
        <ToastContainer position="top-right" autoClose={4000} theme="light" />

        <Link
          to="/"
          className="mb-6 flex items-center font-semibold transition-colors duration-300"
          style={{ color: THEME.PRIMARY }}
        >
          <FaArrowLeft className="mr-2" />
          Back to Home
        </Link>

        <div
          className="flex flex-col overflow-hidden rounded-3xl md:flex-row"
          style={{
            backgroundColor: THEME.CARD,
            border: `1px solid ${THEME.BORDER}`,
            boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
          }}
        >
          {/* Image Section */}
          <div className="relative hidden md:block md:w-1/2">
            <img
              src="/lotion1.jpg"
              alt="Join Mane & More"
              className="h-full w-full object-cover"
            />

            <div
              className="absolute inset-0 flex items-end"
              style={{
                background:
                  "linear-gradient(to top, rgba(74,49,95,0.82), rgba(74,49,95,0.15), transparent)",
              }}
            >
              <div className="p-8 text-white">
                <h2 className="mb-2 text-3xl font-bold">
                  Begin Your Journey
                </h2>
                <p className="text-white/85">
                  Join Mane & More for a personalized beauty experience.
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full p-8 md:w-1/2 md:p-12">
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center">
              
                <span
                  className="text-2xl font-bold"
                  style={{ color: THEME.PRIMARY }}
                >
                  Mane & More
                </span>
              </div>

              <h1
                className="mb-2 text-3xl font-bold"
                style={{ color: THEME.HEADING }}
              >
                Create Your Mane & More Account
              </h1>

              <p style={{ color: THEME.TEXT }}>
                Start your  journey with us today.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleRegister}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.TEXT }}
                >
                  Full Name <span style={{ color: THEME.PRIMARY }}>*</span>
                </label>

                <div className="relative">
                  <FaUser
                    className="absolute left-4 top-3.5"
                    style={{ color: THEME.MUTED }}
                  />

                  <input
                    type="text"
                    className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none"
                    style={inputStyle}
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.TEXT }}
                >
                  Email Address <span style={{ color: THEME.PRIMARY }}>*</span>
                </label>

                <div className="relative">
                  <FaEnvelope
                    className="absolute left-4 top-3.5"
                    style={{ color: THEME.MUTED }}
                  />

                  <input
                    type="email"
                    className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none"
                    style={inputStyle}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.TEXT }}
                >
                  Phone Number{" "}
                  <span style={{ color: THEME.MUTED }}>(Optional)</span>
                </label>

                <div className="relative">
                  <FaPhone
                    className="absolute left-4 top-3.5"
                    style={{ color: THEME.MUTED }}
                  />

                  <input
                    type="tel"
                    className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none"
                    style={inputStyle}
                    placeholder="+44 07767925235"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>

                <p className="mt-1 text-xs" style={{ color: THEME.MUTED }}>
                  Example: +44 07767925235
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.TEXT }}
                >
                  Password <span style={{ color: THEME.PRIMARY }}>*</span>
                </label>

                <div className="relative">
                  <FaLock
                    className="absolute left-4 top-3.5"
                    style={{ color: THEME.MUTED }}
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl py-3 pl-11 pr-12 outline-none"
                    style={inputStyle}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: THEME.MUTED }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <p className="mt-1 text-xs" style={{ color: THEME.MUTED }}>
                  Must be at least 6 characters.
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.TEXT }}
                >
                  Confirm Password{" "}
                  <span style={{ color: THEME.PRIMARY }}>*</span>
                </label>

                <div className="relative">
                  <FaLock
                    className="absolute left-4 top-3.5"
                    style={{ color: THEME.MUTED }}
                  />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-2xl py-3 pl-11 pr-12 outline-none"
                    style={inputStyle}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ color: THEME.MUTED }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: THEME.PRIMARY }}
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                />

                <label
                  htmlFor="terms"
                  className="ml-3 text-sm"
                  style={{ color: THEME.TEXT }}
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-semibold"
                    style={{ color: THEME.PRIMARY }}
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="font-semibold"
                    style={{ color: THEME.PRIMARY }}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || isTransitioning}
                className="flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                style={{
                  backgroundColor: THEME.PRIMARY,
                  color: "#FFFFFF",
                  boxShadow: "0 12px 25px rgba(74,49,95,0.20)",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {isTransitioning ? "Welcome to Mane & More!" : "Creating Account..."}
                  </>
                ) : (
                  "Create My Mane & More Account"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p style={{ color: THEME.TEXT }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold"
                  style={{ color: THEME.PRIMARY }}
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Benefits Section */}
            <div
              className="mt-8 border-t pt-6"
              style={{ borderColor: THEME.BORDER }}
            >
              <h3
                className="mb-3 text-center text-sm font-semibold"
                style={{ color: THEME.HEADING }}
              >
                Mane & More Membership Benefits
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <FaGem />, text: "Exclusive offers" },
                  { icon: <FaStar />, text: "Fast checkout" },
                  { icon: <FaHeart />, text: "Order history" },
                  { icon: <FaEnvelope />, text: "Wishlist" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center">
                    <div
                      className="mr-2 flex h-6 w-6 items-center justify-center rounded-full text-xs"
                      style={{
                        backgroundColor: THEME.SOFT_GREEN,
                        color: THEME.PRIMARY,
                      }}
                    >
                      {item.icon}
                    </div>

                    <span className="text-xs" style={{ color: THEME.TEXT }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
