import { useNavigate } from "react-router-dom";

const Category = () => {
  const navigate = useNavigate();

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

  const categories = [
    {
      id: 4,
      name: "HairExtensions",
      icon: "✨",
      image:
        "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=687&auto=format&fit=crop",
    },
    {
      id: 5,
      name: "Hair Care",
      icon: "💈",
      image:
        "https://images.unsplash.com/photo-1560264641-1b5191cc63e2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 6,
      name: "Beard & Shaving",
      icon: "🧔",
      image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186",
    },
    {
      id: 7,
      name: "Skincare",
      tag: "POPULAR",
      icon: "✨",
      image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273",
    },
  ];

  const handleCategoryClick = (categoryName) => {
    navigate(`/products/${categoryName.toLowerCase().replace(/\s+/g, "")}`);
  };

  const handleDiscoverProducts = () => {
    navigate("/products");
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 py-20"
      style={{ backgroundColor: THEME.BG }}
    >
      {/* Soft Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-10 top-20 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(239,198,90,0.18)" }}
        />
        <div
          className="absolute bottom-20 right-10 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(74,49,95,0.10)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-20 text-center">
          <div
            className="mb-6 inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              backgroundColor: THEME.CARD,
              color: THEME.PRIMARY,
              border: `1px solid ${THEME.BORDER}`,
              boxShadow: "0 10px 30px rgba(74,49,95,0.06)",
            }}
          >
            ✂️ Premium Grooming Collection
          </div>

          <h1
            className="mb-6 text-5xl font-bold md:text-6xl"
            style={{ color: THEME.HEADING }}
          >
            Shop By Category
          </h1>

          <p
            className="mx-auto max-w-3xl text-xl leading-relaxed"
            style={{ color: THEME.TEXT }}
          >
            Discover premium barber-grade products crafted for modern gentlemen.
            From hair extensions and styling to beard care and skincare,
            everything you need for the perfect grooming routine.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-10">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="group relative h-[420px] w-72 cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-3"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
                boxShadow: "0 14px 35px rgba(74,49,95,0.10)",
              }}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(74,49,95,0.88), rgba(74,49,95,0.35), rgba(255,255,255,0.05))",
                }}
              />

              {cat.tag && (
                <div className="absolute left-4 top-4 z-20">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold tracking-wider"
                    style={{
                      backgroundColor: THEME.GOLD,
                      color: THEME.PRIMARY_DARK,
                    }}
                  >
                    {cat.tag}
                  </span>
                </div>
              )}

              <div
                className="absolute inset-0 rounded-3xl transition-all duration-500 group-hover:opacity-100"
                style={{
                  border: `1px solid rgba(239,198,90,0.45)`,
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
                <div className="mb-4 text-5xl">{cat.icon}</div>

                <h3 className="mb-2 text-2xl font-bold text-white">
                  {cat.name}
                </h3>

                <div
                  className="flex items-center font-semibold"
                  style={{ color: THEME.GOLD }}
                >
                  Explore Collection
                  <svg
                    className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-24 text-center">
          <div
            className="mx-auto max-w-4xl rounded-3xl p-10 backdrop-blur-xl"
            style={{
              backgroundColor: THEME.CARD,
              border: `1px solid ${THEME.BORDER}`,
              boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
            }}
          >
            <h2
              className="mb-4 text-3xl font-bold"
              style={{ color: THEME.HEADING }}
            >
              Professional Barber Products
            </h2>

            <p className="mb-8" style={{ color: THEME.MUTED }}>
              Premium extensions, styling, grooming and beard care products
              trusted by professional barbers worldwide.
            </p>

            <button
              className="rounded-xl px-8 py-4 font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: THEME.PRIMARY,
                color: "#FFFFFF",
                boxShadow: "0 12px 25px rgba(74,49,95,0.22)",
              }}
              onClick={handleDiscoverProducts}
            >
              Explore All Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
