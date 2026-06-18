import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { removeFromWishlist, clearWishlist } from "../redux/wishlistRedux";
import Product from "../components/Product";
import { FaHeart, FaTrashAlt } from "react-icons/fa";

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

const Wishlist = () => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.products);

  return (
    <div
      className="min-h-screen px-4 py-24"
      style={{ backgroundColor: THEME.BG }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: THEME.SOFT_GREEN }}
          >
            <FaHeart className="text-3xl" style={{ color: THEME.PRIMARY }} />
          </div>

          <h1
            className="text-4xl font-bold"
            style={{ color: THEME.HEADING }}
          >
            My Wishlist
          </h1>

          <p className="mt-3" style={{ color: THEME.TEXT }}>
            Your saved favorite products.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div
            className="mx-auto max-w-xl rounded-3xl p-10 text-center"
            style={{
              backgroundColor: THEME.CARD,
              border: `1px solid ${THEME.BORDER}`,
            }}
          >
            <h2
              className="mb-3 text-2xl font-bold"
              style={{ color: THEME.HEADING }}
            >
              Your wishlist is empty
            </h2>

            <p className="mb-6" style={{ color: THEME.TEXT }}>
              Add products you love and find them here later.
            </p>

            <Link
              to="/#premium-collection"
              className="inline-block rounded-full px-8 py-3 font-semibold"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
              }}
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => dispatch(clearWishlist())}
                className="flex items-center rounded-xl px-5 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: THEME.CARD,
                  color: "#DC2626",
                  border: `1px solid ${THEME.BORDER}`,
                }}
              >
                <FaTrashAlt className="mr-2" />
                Clear Wishlist
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {wishlist.map((product) => (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="relative block"
                >
                  <Product product={product} />

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(removeFromWishlist(product._id));
                    }}
                    className="absolute right-4 top-4 z-20 rounded-full p-3"
                    style={{
                      backgroundColor: THEME.CARD,
                      color: "#DC2626",
                      border: `1px solid ${THEME.BORDER}`,
                    }}
                  >
                    <FaTrashAlt />
                  </button>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
