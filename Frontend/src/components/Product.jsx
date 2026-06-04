import { showAverageRating } from "./Ratings";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../redux/wishlistRedux";
import { FaHeart } from "react-icons/fa";

const Product = ({ product }) => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.products);

  const isWishlisted = wishlist.some((item) => item._id === product._id);

  const handleWishlist = (e) => {
    e.preventDefault();

    if (isWishlisted) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product));
    }
  };
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

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
      style={{
        backgroundColor: THEME.CARD,
        border: `1px solid ${THEME.BORDER}`,
        boxShadow: "0 14px 35px rgba(74,49,95,0.10)",
      }}
    >
      {/* Product Image */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={product.img[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Soft Purple Overlay */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "linear-gradient(to top, rgba(74,49,95,0.55), rgba(74,49,95,0.08), transparent)",
          }}
        />

        {/* Discount Badge */}
        {product.discount && (
          <div
            className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-lg"
            style={{
              backgroundColor: THEME.GOLD,
              color: THEME.PRIMARY_DARK,
            }}
          >
            -{product.discount}%
          </div>
        )}

        {/* Quick View */}
        <button
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100"
          style={{
            backgroundColor: "rgba(255,255,255,0.88)",
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            style={{ color: THEME.PRIMARY }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-4 top-16 flex h-10 w-10 items-center justify-center rounded-full opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100"
          style={{
            backgroundColor: "rgba(255,255,255,0.88)",
            border: `1px solid ${THEME.BORDER}`,
          }}
        >
          <FaHeart
            className="h-5 w-5"
            style={{
              color: isWishlisted ? "#DC2626" : THEME.PRIMARY,
            }}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col p-5">
        {/* Category Label */}
        <div
          className="mb-2 text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: THEME.PRIMARY }}
        >
          Premium Grooming
        </div>

        {/* Product Title */}
        <h2
          className="mb-3 min-h-[56px] text-lg font-semibold line-clamp-2"
          style={{ color: THEME.HEADING }}
        >
          {product.title}
        </h2>

        {/* Rating */}
        {product.ratingsCount ? (
          <div className="mb-4 flex items-center">
            {showAverageRating(product)}
            <span className="ml-2 text-xs" style={{ color: THEME.MUTED }}>
              ({product.ratingsCount})
            </span>
          </div>
        ) : (
          <div className="h-6"></div>
        )}

        {/* Divider */}
        <div
          className="mb-4 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(74,49,95,0.22), transparent)",
          }}
        ></div>

        {/* Price + Button */}
        <div className="mt-auto flex items-center justify-between">
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: THEME.PRIMARY }}
            >
              ${product.originalPrice}
            </div>

            {product.originalPrice > product.price && (
              <div
                className="text-sm line-through"
                style={{ color: THEME.MUTED }}
              >
                ${product.price}
              </div>
            )}
          </div>

          <button
            className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
            style={{
              backgroundColor: THEME.PRIMARY,
              boxShadow: "0 10px 25px rgba(74,49,95,0.22)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Hover Border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          border: `1px solid rgba(74,49,95,0.28)`,
        }}
      ></div>
    </div>
  );
};

export default Product;