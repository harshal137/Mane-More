import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { trackButtonClick, trackUserAction } from "../utils/analytics";
import { logOut } from "../redux/userRedux";
import { userRequest } from "../requestMethods";
import {
  FaSearch,
  FaUser,
  FaHeart,
  FaTimes,
  FaShoppingBag,
  FaBars,
  FaBoxOpen,
  FaSignOutAlt,
} from "react-icons/fa";

const THEME = {
  NAV_BG: "#F8F7F5",
  NAV_BORDER: "#ECEAE6",
  PRIMARY: "#3E2C4F",
  MUTED: "#6D6875",
  SEARCH_BG: "#FFFFFF",
  SEARCH_BORDER: "#ECEAE6",
};

/** Converts a category label to the URL segment used by product listings. */
const slugifyCategory = (category) =>
  category.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "");

/** Renders responsive navigation, account actions, and live categories. */
const Navbar = () => {
  const [search, setSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState([
    { key: "HairExtensions", to: "/products/hairextensions" },
    { key: "HairCare", to: "/products/haircare" },
    { key: "Beard & Shaving", to: "/products/beardshaving" },
    { key: "SkinCare", to: "/products/skincare" },
  ]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const cart = useSelector((s) => s.cart || { quantity: 0 });
  const user = useSelector((s) => s.user || {});
  const wishlist = useSelector((s) => s.wishlist || { products: [] });

  useEffect(() => {
    const fetchCatalogOptions = async () => {
      try {
        const res = await userRequest.get("/catalog-options");
        const categories = (res.data.categories || []).slice(0, 5);

        if (categories.length) {
          setNavItems(
            categories.map((category) => ({
              key: category,
              to: `/products/${slugifyCategory(category)}`,
            }))
          );
        }
      } catch (error) {
      }
    };

    fetchCatalogOptions();
  }, []);

  const userName =
    user?.currentUser?.name || user?.currentUser?.username || "Account";

  const wishlistCount = wishlist?.products?.length || 0;

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsSearchExpanded(false);
  };

  const handleNavClick = (key) => {
    trackButtonClick("nav_click", { category: key, location: "navbar" });
    closeMobileMenu();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    trackUserAction("search_query", "search", {
      query: search,
      location: "navbar",
    });

    navigate(`/products/${search.trim().toLowerCase().replace(/\s+/g, "")}`);
    setSearch("");
    closeMobileMenu();
  };

  const handleLogout = () => {
    dispatch(logOut());
    closeMobileMenu();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        .navbar-input::placeholder {
          color: ${THEME.MUTED};
          opacity: 1;
        }

        .nav-link {
          color: ${THEME.MUTED};
          position: relative;
          transition: color 220ms ease;
          padding-bottom: 6px;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 100%;
          background: ${THEME.PRIMARY};
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 260ms ease;
          border-radius: 2px;
        }

        .nav-link:hover,
        .nav-link.active {
          color: ${THEME.PRIMARY};
        }

        .nav-link.active::after {
          transform: scaleX(1);
        }
      `}</style>

      <nav
        className="fixed left-0 right-0 top-0 z-50 w-full backdrop-blur-md"
        style={{
          backgroundColor: "rgba(248, 247, 245, 0.96)",
          borderBottom: `1px solid ${THEME.NAV_BORDER}`,
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => trackButtonClick("logo_click", { location: "navbar" })}
            className="flex items-center h-full"
          >
            <img
              src="/logo.png"
              alt="Mane & More"
              className="h-14 md:h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop category links */}
          <div className="hidden flex-1 items-center justify-center space-x-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => handleNavClick(item.key)}
                className={`nav-link text-sm font-medium ${isActive(item.to) ? "active" : ""
                  }`}
              >
                {item.key}
              </Link>
            ))}
          </div>




          {/* Right icons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search icon for tablet/mobile */}
            <button
              type="button"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300"
              style={{ color: THEME.PRIMARY }}
              aria-label="Toggle search"
            >
              {isSearchExpanded ? <FaTimes /> : <FaSearch />}
            </button>

            <Link
              to="/wishlist"
              onClick={() => trackButtonClick("wishlist_open", { location: "navbar" })}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full sm:flex"
              style={{ color: THEME.PRIMARY }}
              aria-label="Wishlist"
            >
              <FaHeart />

              {wishlistCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: THEME.PRIMARY,
                    color: THEME.NAV_BG,
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              onClick={() => trackButtonClick("cart_open", { location: "navbar" })}
              className="relative flex h-10 w-10 items-center justify-center rounded-full"
              style={{ color: THEME.PRIMARY }}
              aria-label="Cart"
            >
              <FaShoppingBag />

              {cart?.quantity > 0 && (
                <span
                  className="absolute -right-1 -top-1 rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: THEME.PRIMARY,
                    color: THEME.NAV_BG,
                  }}
                >
                  {cart.quantity}
                </span>
              )}
            </Link>

            {/* Desktop/tablet account with user name */}
            <Link
              to={user?.currentUser ? "/myaccount" : "/login"}
              onClick={() => trackButtonClick("account_open", { location: "navbar" })}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium sm:flex"
              style={{
                color: THEME.PRIMARY,
                backgroundColor: "#FFFFFF",
                border: `1px solid ${THEME.NAV_BORDER}`,
              }}
            >
              <FaUser />
              <span className="max-w-[100px] truncate">{userName}</span>
            </Link>

            {/* Hamburger for mobile/tablet */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
              style={{ color: THEME.PRIMARY }}
              aria-label="Open menu"
            >
              <FaBars />
            </button>
          </div>
        </div>

        {/* Mobile/tablet search bar */}
        {isSearchExpanded && (
          <div
            className="absolute left-0 right-0 top-full border-b px-4 py-3 shadow-lg"
            style={{
              backgroundColor: THEME.NAV_BG,
              borderColor: THEME.NAV_BORDER,
            }}
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full px-4 py-2.5 pr-10 text-sm outline-none"
                style={{
                  backgroundColor: THEME.SEARCH_BG,
                  border: `1px solid ${THEME.SEARCH_BORDER}`,
                  color: THEME.MUTED,
                }}
                autoFocus
              />

              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: THEME.PRIMARY }}
                aria-label="Search"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        )}
      </nav>

      {/* Mobile sidebar overlay */}
      <div
        onClick={closeMobileMenu}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 md:hidden ${isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
      />

      {/* Mobile sidebar menu */}
      <aside
        className={`fixed right-0 top-0 z-[60] h-full w-[82%] max-w-sm transform transition-transform duration-300 ease-out md:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        style={{
          backgroundColor: THEME.NAV_BG,
          borderLeft: `1px solid ${THEME.NAV_BORDER}`,
        }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: THEME.NAV_BORDER }}>
          <div className="flex items-center gap-3">
            <FaUser style={{ color: THEME.PRIMARY }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: THEME.PRIMARY }}>
                {userName}
              </p>
              <p className="text-xs" style={{ color: THEME.MUTED }}>
                {user?.currentUser ? "Logged in" : "Guest user"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ color: THEME.PRIMARY }}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          {/* Mobile categories */}
          <div>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: THEME.MUTED }}
            >
              Categories
            </p>

            <div className="grid gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => handleNavClick(item.key)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300"
                  style={{
                    color: isActive(item.to) ? "#FFFFFF" : THEME.PRIMARY,
                    backgroundColor: isActive(item.to)
                      ? THEME.PRIMARY
                      : "#FFFFFF",
                    border: `1px solid ${THEME.NAV_BORDER}`,
                  }}
                >
                  {item.key}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile account options */}
          <div>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: THEME.MUTED }}
            >
              Account
            </p>

            <div className="grid gap-3">
              <Link
                to="/wishlist"
                onClick={closeMobileMenu}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  color: isActive("/wishlist") ? "#FFFFFF" : THEME.PRIMARY,
                  backgroundColor: isActive("/wishlist")
                    ? THEME.PRIMARY
                    : "#FFFFFF",
                  border: `1px solid ${THEME.NAV_BORDER}`,
                }}
              >
                <span className="flex items-center gap-3">
                  <FaHeart />
                  Wishlist
                </span>
                {wishlistCount > 0 && <span>{wishlistCount}</span>}
              </Link>

              <Link
                to="/myorders"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  color: isActive("/myorders") ? "#FFFFFF" : THEME.PRIMARY,
                  backgroundColor: isActive("/myorders")
                    ? THEME.PRIMARY
                    : "#FFFFFF",
                  border: `1px solid ${THEME.NAV_BORDER}`,
                }}
              >
                <FaBoxOpen />
                My Orders
              </Link>

              <Link
                to={user?.currentUser ? "/myaccount" : "/login"}
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  color: isActive("/myaccount") || isActive("/login")
                    ? "#FFFFFF"
                    : THEME.PRIMARY,
                  backgroundColor:
                    isActive("/myaccount") || isActive("/login")
                      ? THEME.PRIMARY
                      : "#FFFFFF",
                  border: `1px solid ${THEME.NAV_BORDER}`,
                }}
              >
                <FaUser />
                {user?.currentUser ? "My Account" : "Login"}
              </Link>

              {user?.currentUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold"
                  style={{
                    color: "#DC2626",
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${THEME.NAV_BORDER}`,
                  }}
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="h-[72px] sm:h-[84px]"></div>
    </>
  );
};

export default Navbar;
