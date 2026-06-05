import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import { login } from "../redux/apiCalls";
import { userRequest } from "../requestMethods";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaHeart,
  FaStar,
  FaGem,
} from "react-icons/fa";

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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetStep, setResetStep] = useState("email");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user.currentUser) {
      navigate("/");
    }
  }, [user.currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const loggedInUser = await login(dispatch, { email, password });

      setTimeout(() => {
        if (loggedInUser) {
          setIsTransitioning(true);

          toast.success(
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <FaStar className="mr-2" style={{ color: THEME.GOLD }} />
                <span className="font-bold">Welcome to Mane & More!</span>
              </div>
              <p className="text-sm">Your beauty journey continues...</p>
            </div>
          );

          setTimeout(() => {
            navigate("/");
          }, 800);
        } else {
          toast.error(
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <FaHeart className="mr-2" style={{ color: THEME.PRIMARY }} />
                <span className="font-medium">Oops! Let's try that again</span>
              </div>
              <p className="text-sm">
                The email or password does not match our records.
              </p>
            </div>,
            { autoClose: 6000, closeOnClick: true }
          );
        }
      }, 1000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "The email or password does not match our records.";

      toast.error(
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center">
            <FaHeart className="mr-2" style={{ color: THEME.PRIMARY }} />
            <span className="font-medium">Oops! Let's try that again</span>
          </div>
          <p className="text-sm">{message}</p>
        </div>,
        { autoClose: 6000, closeOnClick: true }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center">
          <FaGem className="mr-2" style={{ color: THEME.PRIMARY }} />
          <span className="font-medium">{provider} Login Coming Soon!</span>
        </div>
        <p className="text-sm">
          For now, please use your email and password.
        </p>
      </div>,
      { autoClose: 5000, closeOnClick: true }
    );
  };

  const resetForgotForm = () => {
    setForgotEmail("");
    setResetCode("");
    setResetStep("email");
    setResetPassword("");
    setConfirmResetPassword("");
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setResetLoading(true);
      const res = await userRequest.post("/auth/forgot-password", {
        email: forgotEmail,
      });

      setResetStep("code");
      toast.success(res.data?.message || "Password reset code sent.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start password reset");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();

    if (!resetCode || !/^\d{6}$/.test(resetCode)) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    try {
      setResetLoading(true);
      await userRequest.post("/auth/verify-reset-code", {
        email: forgotEmail,
        code: resetCode,
      });

      setResetStep("password");
      toast.success("Code verified. Enter your new password.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not verify reset code");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetCode) {
      toast.error("Verification code is missing");
      return;
    }

    if (resetPassword.length < 6) {
      toast.error("Password should be at least 6 characters long");
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setResetLoading(true);
      await userRequest.post("/auth/reset-password", {
        token: resetCode,
        password: resetPassword,
      });

      toast.success("Password reset successfully. Please login.");
      setShowForgotModal(false);
      resetForgotForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reset password");
    } finally {
      setResetLoading(false);
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
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
              style={{ backgroundColor: THEME.CARD, border: `1px solid ${THEME.BORDER}` }}
            >
              <h2 className="text-xl font-bold" style={{ color: THEME.HEADING }}>
                Reset Password
              </h2>
              <p className="mt-2 text-sm" style={{ color: THEME.TEXT }}>
                {resetStep === "email" && "Enter your customer account email to receive a 6-digit verification code."}
                {resetStep === "code" && "Enter the 6-digit code sent to your email."}
                {resetStep === "password" && "Create a new password for your account."}
              </p>

              <form
                className="mt-5 space-y-4"
                onSubmit={
                  resetStep === "email"
                    ? handleForgotPassword
                    : resetStep === "code"
                    ? handleVerifyResetCode
                    : handleResetPassword
                }
              >
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle}
                  placeholder="your@email.com"
                  disabled={resetStep !== "email"}
                />

                {resetStep !== "email" && (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-2xl px-4 py-3 text-center text-lg font-semibold tracking-[0.35em] outline-none"
                    style={inputStyle}
                    placeholder="000000"
                    disabled={resetStep === "password"}
                  />
                )}

                {resetStep === "password" && (
                  <>
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full rounded-2xl px-4 py-3 outline-none"
                      style={inputStyle}
                      placeholder="New password"
                    />
                    <input
                      type="password"
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      className="w-full rounded-2xl px-4 py-3 outline-none"
                      style={inputStyle}
                      placeholder="Confirm new password"
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-2xl px-5 py-3 font-semibold disabled:opacity-60"
                  style={{ backgroundColor: THEME.PRIMARY, color: "#FFFFFF" }}
                >
                  {resetLoading
                    ? "Please wait..."
                    : resetStep === "password"
                    ? "Reset Password"
                    : resetStep === "code"
                    ? "Verify Code"
                    : "Send Verification Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    resetForgotForm();
                  }}
                  className="w-full rounded-2xl px-5 py-3 font-semibold"
                  style={{
                    backgroundColor: THEME.BG,
                    color: THEME.TEXT,
                    border: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

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
          <div className="relative hidden md:block md:w-1/2">
            <img
              src="/lotion1.jpg"
              alt="Login to Mane & More"
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
                  Welcome Back
                </h2>
                <p className="text-white/85">
                  Your beauty sanctuary awaits.
                </p>
              </div>
            </div>
          </div>

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
                Sign In to DB
              </h1>

              <p style={{ color: THEME.TEXT }}>
                Access your personalized beauty experience.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.TEXT }}
                >
                  Email Address
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
                  Password
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
                    placeholder="Enter your password"
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
              </div>

              <div className="flex items-center justify-between gap-4">
                <label
                  className="flex items-center text-sm"
                  style={{ color: THEME.TEXT }}
                >
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded"
                    style={{ accentColor: THEME.PRIMARY }}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-sm font-semibold"
                  style={{ color: THEME.PRIMARY }}
                >
                  Forgot password?
                </button>
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
                    {isTransitioning ? "Welcome to DB!" : "Signing in..."}
                  </>
                ) : (
                  "Access My DB Account"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p style={{ color: THEME.TEXT }}>
                New to Mane & More?{" "}
                <Link
                  to="/create-account"
                  className="font-semibold"
                  style={{ color: THEME.PRIMARY }}
                >
                  Create your DB account
                </Link>
              </p>
            </div>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className="w-full border-t"
                    style={{ borderColor: THEME.BORDER }}
                  />
                </div>

                <div className="relative flex justify-center text-sm">
                  <span
                    className="px-3"
                    style={{
                      backgroundColor: THEME.CARD,
                      color: THEME.MUTED,
                    }}
                  >
                    Future DB access options
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  className="inline-flex w-full justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: THEME.CARD,
                    border: `1px solid ${THEME.BORDER}`,
                    color: THEME.TEXT,
                  }}
                >
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("Facebook")}
                  className="inline-flex w-full justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: THEME.CARD,
                    border: `1px solid ${THEME.BORDER}`,
                    color: THEME.TEXT,
                  }}
                >
                  Facebook
                </button>
              </div>

              <p className="mt-4 text-center text-xs italic" style={{ color: THEME.MUTED }}>
                DB Tip: Use your email and password for instant access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
