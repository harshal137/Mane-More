import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";

const THEME = {
  BG: "#F8F5F1",
  CARD: "#FFFFFF",
  PRIMARY: "#4A315F",
  PRIMARY_DARK: "#3B284D",
  GOLD: "#EFC65A",
  HEADING: "#111827",
  TEXT: "#5F5A6E",
  BORDER: "#E8E1DA",
  SOFT_GREEN: "#E8F1D8",
};

const Error = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: THEME.BG }}
    >
      <div
        className="max-w-xl w-full text-center rounded-[32px] p-10"
        style={{
          backgroundColor: THEME.CARD,
          border: `1px solid ${THEME.BORDER}`,
          boxShadow: "0 20px 50px rgba(74,49,95,0.08)",
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundColor: THEME.SOFT_GREEN,
          }}
        >
          <FaExclamationTriangle
            className="text-4xl"
            style={{ color: THEME.PRIMARY }}
          />
        </div>

        {/* Error Code */}
        <h1
          className="text-7xl font-bold mb-2"
          style={{ color: THEME.PRIMARY }}
        >
          404
        </h1>

        {/* Heading */}
        <h2
          className="text-3xl font-bold mb-4"
          style={{ color: THEME.HEADING }}
        >
          Page Not Found
        </h2>

        {/* Description */}
        <p
          className="mb-8 leading-relaxed"
          style={{ color: THEME.TEXT }}
        >
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back to shopping.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: THEME.PRIMARY,
              color: "#FFFFFF",
              boxShadow: "0 12px 25px rgba(74,49,95,0.18)",
            }}
          >
            <FaHome />
            Back Home
          </Link>

          <Link
            to="/#premium-collection"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: THEME.CARD,
              color: THEME.PRIMARY,
              border: `1px solid ${THEME.BORDER}`,
            }}
          >
            Browse Products
          </Link>
        </div>

        {/* Decorative Line */}
        <div
          className="mt-10 h-1 rounded-full mx-auto w-32"
          style={{
            background: `linear-gradient(to right, ${THEME.PRIMARY}, ${THEME.GOLD})`,
          }}
        />
      </div>
    </div>
  );
};

export default Error;
