import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logOut, loginSuccess } from "../redux/userRedux";
import { userRequest } from "../requestMethods";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaSignOutAlt,
  FaSave,
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

const Myaccount = () => {
  const user = useSelector((state) => state.user);
  const currentUser = user.currentUser;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [currentPasswordStatus, setCurrentPasswordStatus] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setProfileForm({
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
    });
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await userRequest.post("/auth/logout");
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(logOut());
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: name === "phone" ? value.replace(/[^\d+]/g, "") : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "currentPassword") {
      setCurrentPasswordStatus(null);
    }
  };

  useEffect(() => {
    const currentPassword = passwordForm.currentPassword;

    if (!currentPassword) {
      setCurrentPasswordStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingPassword(true);
        const res = await userRequest.post("/users/me/password/check", {
          currentPassword,
        });

        setCurrentPasswordStatus({
          isCorrect: Boolean(res.data?.isCorrect),
          message: res.data?.message || "",
        });
      } catch (error) {
        setCurrentPasswordStatus({
          isCorrect: false,
          message:
            error.response?.data?.message || "Could not check current password",
        });
      } finally {
        setCheckingPassword(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [passwordForm.currentPassword]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSavingProfile(true);

      const res = await userRequest.put("/users/me/profile", {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
      });

      dispatch(loginSuccess(res.data));
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile could not be updated");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password should be at least 6 characters long");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setSavingPassword(true);

      await userRequest.put("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setCurrentPasswordStatus(null);
      toast.success("Password updated successfully");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login again before updating your password");
        return;
      }

      toast.error(error.response?.data?.message || "Password could not be updated");
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle = {
    backgroundColor: THEME.BG,
    border: `1px solid ${THEME.BORDER}`,
    color: THEME.TEXT,
  };

  const featureCards = [
    {
      title: "My Orders",
      desc: "View your orders and purchases",
      route: "/myorders",
      iconPath: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    },
    {
      title: "Wishlist",
      desc: "See your saved favorite products",
      route: "/wishlist",
      iconPath:
        "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    },
    {
      title: "Preferences",
      desc: "Customize your shopping experience",
      iconPath:
        "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <div
      className="min-h-screen px-4 pb-10 pt-24 sm:px-6 lg:px-8"
      style={{ backgroundColor: THEME.BG }}
    >
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div
            className="mb-4 inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              backgroundColor: THEME.CARD,
              color: THEME.PRIMARY,
              border: `1px solid ${THEME.BORDER}`,
              boxShadow: "0 10px 30px rgba(74,49,95,0.06)",
            }}
          >
            Account Center
          </div>

          <h1
            className="mb-2 text-3xl font-bold md:text-4xl"
            style={{ color: THEME.HEADING }}
          >
            My Account
          </h1>

          <p style={{ color: THEME.TEXT }}>
            Manage your personal information and account settings.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-3xl"
          style={{
            backgroundColor: THEME.CARD,
            border: `1px solid ${THEME.BORDER}`,
            boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
          }}
        >
          <div
            className="border-b p-8"
            style={{
              backgroundColor: THEME.SOFT_GREEN,
              borderColor: THEME.BORDER,
            }}
          >
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  backgroundColor: THEME.CARD,
                  border: `1px solid ${THEME.BORDER}`,
                }}
              >
                <FaUser className="text-2xl" style={{ color: THEME.PRIMARY }} />
              </div>

              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: THEME.HEADING }}
                >
                  {profileForm.name || "Guest User"}
                </h2>

                <p style={{ color: THEME.TEXT }}>
                  {profileForm.email || "No email available"}
                </p>

                <p className="mt-1 text-sm" style={{ color: THEME.TEXT }}>
                  {profileForm.phone || "No phone number added"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-2">
            <div>
              <h3
                className="mb-6 flex items-center text-xl font-semibold"
                style={{ color: THEME.HEADING }}
              >
                <FaUser className="mr-2" style={{ color: THEME.PRIMARY }} />
                Personal Information
              </h3>

              <form className="space-y-5" onSubmit={handleProfileSubmit}>
                <ProfileInput
                  label="Full Name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  icon={<FaUser />}
                  inputStyle={inputStyle}
                />

                <ProfileInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  icon={<FaEnvelope />}
                  inputStyle={inputStyle}
                  readOnly
                />

                <ProfileInput
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  icon={<FaPhone />}
                  inputStyle={inputStyle}
                  placeholder="Add your phone number"
                />

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold"
                    style={{ color: THEME.TEXT }}
                  >
                    Address
                  </label>

                  <div className="relative">
                    <FaMapMarkerAlt
                      className="absolute left-4 top-3.5"
                      style={{ color: THEME.MUTED }}
                    />

                    <textarea
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      rows={4}
                      className="w-full resize-none rounded-2xl py-3 pl-11 pr-4 outline-none"
                      style={inputStyle}
                      placeholder="Add or update your delivery address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: THEME.PRIMARY,
                    color: "#FFFFFF",
                    boxShadow: "0 12px 25px rgba(74,49,95,0.18)",
                  }}
                >
                  <FaSave className="mr-2" />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            <div>
              <h3
                className="mb-6 flex items-center text-xl font-semibold"
                style={{ color: THEME.HEADING }}
              >
                <FaLock className="mr-2" style={{ color: THEME.PRIMARY }} />
                Password & Security
              </h3>

              <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                <PasswordInput
                  label="Current Password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  inputStyle={inputStyle}
                  helperText={
                    checkingPassword
                      ? "Checking current password..."
                      : currentPasswordStatus?.message
                  }
                  helperTone={
                    currentPasswordStatus?.isCorrect ? "success" : "error"
                  }
                />

                <PasswordInput
                  label="New Password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  inputStyle={inputStyle}
                />

                <PasswordInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  inputStyle={inputStyle}
                />

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: THEME.SOFT_GREEN,
                    color: THEME.PRIMARY,
                    border: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: THEME.CARD,
                    color: "#DC2626",
                    border: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {featureCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => card.route && navigate(card.route)}
              className="rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
                boxShadow: "0 16px 45px rgba(74,49,95,0.07)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: THEME.SOFT_GREEN }}
              >
                <svg
                  className="h-6 w-6"
                  style={{ color: THEME.PRIMARY }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={card.iconPath}
                  />
                </svg>
              </div>

              <h3 className="mb-2 font-semibold" style={{ color: THEME.HEADING }}>
                {card.title}
              </h3>

              <p className="text-sm" style={{ color: THEME.TEXT }}>
                {card.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  icon,
  inputStyle,
  placeholder = "",
  readOnly = false,
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
      {label}
    </label>

    <div className="relative">
      <span className="absolute left-4 top-3.5" style={{ color: THEME.MUTED }}>
        {icon}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none"
        style={{
          ...inputStyle,
          opacity: readOnly ? 0.75 : 1,
        }}
        placeholder={placeholder}
      />
    </div>
  </div>
);

const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  inputStyle,
  helperText = "",
  helperTone = "error",
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold" style={{ color: THEME.TEXT }}>
      {label}
    </label>

    <div className="relative">
      <FaLock
        className="absolute left-4 top-3.5"
        style={{ color: THEME.MUTED }}
      />

      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl py-3 pl-11 pr-4 outline-none"
        style={inputStyle}
      />
    </div>

    {helperText && (
      <p
        className="mt-1 text-xs font-semibold"
        style={{ color: helperTone === "success" ? "#15803D" : "#DC2626" }}
      >
        {helperText}
      </p>
    )}
  </div>
);

export default Myaccount;
