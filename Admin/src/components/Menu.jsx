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
    { icon: FaHome, label: "Home", path: "/home", color: "text-blue-500" },
    { icon: FaUsers, label: "Users", path: "/users", color: "text-purple-500" },
    { icon: FaBox, label: "Products", path: "/products", color: "text-orange-500" },
    { icon: FaClipboardList, label: "Orders", path: "/orders", color: "text-red-500" },
    { icon: FaDollarSign, label: "Payments", path: "/payments", color: "text-teal-500" },
    { icon: FaClipboard, label: "Tracking users", path: "/tracking", color: "text-cyan-500" },
    { icon: FaGift, label: "Bundles", path: "/bundles", color: "text-pink-500" },
    { icon: FaElementor, label: "Banners", path: "/banners", color: "text-indigo-500" },
    { icon: FaCog, label: "Admin Settings", path: "/settings", color: "text-yellow-500" },
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
        className="fixed top-4 right-4 z-50 w-11 h-11 rounded-xl bg-gray-900/80 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-white"
      >
        <FaBars />
      </button>

      {/* Dark Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm overflow-hidden"
        />
      )}

      {/* Glass Menu Card */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw]
          bg-gradient-to-b from-gray-900/85 to-gray-800/85
          backdrop-blur-xl border-r border-white/10 shadow-2xl
          p-6 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <FaGift className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mane & More</h1>
          <p className="text-gray-400 text-sm">Admin Dashboard</p>
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
                      flex items-center px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer mb-1
                      ${
                        active
                          ? "bg-white/10 shadow-lg border-l-4 border-pink-500"
                          : "hover:bg-white/5 hover:border-l-4 hover:border-gray-600"
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-all duration-300
                        ${
                          active
                            ? "bg-pink-500 shadow-lg"
                            : "bg-gray-700 group-hover:bg-gray-600"
                        }
                      `}
                    >
                      <Icon
                        className={`
                          text-lg transition-all duration-300
                          ${active ? "text-white" : item.color}
                        `}
                      />
                    </div>

                    <div className="flex-1">
                      <p
                        className={`
                          font-medium transition-all duration-300
                          ${active ? "text-white" : "text-gray-300 group-hover:text-white"}
                        `}
                      >
                        {item.label}
                      </p>
                    </div>

                    {active && (
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10 group border border-transparent hover:border-red-500/30"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
              <FaSignOutAlt className="text-white text-lg" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Logout</p>
              <p className="text-gray-400 text-xs">Secure sign out</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Menu;
