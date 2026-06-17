import {
  FaBox,
  FaClipboard,
  FaClipboardList,
  FaCog,
  FaElementor,
  FaHome,
  FaSignOutAlt,
  FaUsers,
  FaDollarSign,
  FaGift,
  FaBars,
  FaTimes,
  FaShippingFast,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { icon: FaHome, label: "Home", path: "/home" },
    { icon: FaUsers, label: "Users", path: "/users" },
    { icon: FaBox, label: "Products", path: "/products" },
    { icon: FaClipboardList, label: "Orders", path: "/orders" },
    { icon: FaDollarSign, label: "Payments", path: "/payments" },
    { icon: FaClipboard, label: "Tracking users", path: "/tracking" },
    { icon: FaGift, label: "Bundles", path: "/bundles" },
    { icon: FaElementor, label: "Banners", path: "/banners" },
    { icon: FaShippingFast, label: "Shipping Charges", path: "/shipping-charges" },
    { icon: FaCog, label: "Admin Settings", path: "/settings" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Menu Open Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-200 bg-white/95 text-violet-700 shadow-lg shadow-violet-900/10 backdrop-blur-md transition hover:bg-violet-50"
        aria-label="Open admin menu"
      >
        <FaBars />
      </button>

      {/* Dark Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 overflow-hidden bg-slate-950/40 backdrop-blur-sm"
        />
      )}

      {/* Glass Menu Card */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw]
          border-l border-slate-800 bg-gradient-to-b from-slate-950 to-violet-950
          shadow-2xl shadow-slate-950/30
          p-6 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          aria-label="Close admin menu"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="mb-8 pt-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-950/40">
            <FaGift className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mane & More</h1>
          <p className="text-sm text-violet-200">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`
                      group mb-1 flex cursor-pointer items-center rounded-xl px-3 py-2.5 transition-all duration-200
                      ${
                        active
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <div
                      className={`
                        mr-3 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200
                        ${
                          active
                            ? "bg-violet-500 text-white shadow-md shadow-violet-950/30"
                            : "bg-white/5 text-violet-300 group-hover:bg-white/10"
                        }
                      `}
                    >
                      <Icon className="text-base" />
                    </div>

                    <div className="flex-1">
                      <p
                        className={`
                          font-medium transition-all duration-300
                          ${active ? "text-white" : "text-slate-300 group-hover:text-white"}
                        `}
                      >
                        {item.label}
                      </p>
                    </div>

                    {active && (
                      <div className="h-2 w-2 rounded-full bg-violet-300" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl border border-transparent px-3 py-2.5 transition hover:border-red-400/20 hover:bg-red-400/10"
          >
            <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10 text-red-300">
              <FaSignOutAlt />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Logout</p>
              <p className="text-xs text-slate-400">Secure sign out</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Menu;
