import { useParams } from "react-router-dom";
import Products from "../components/Products";
import { useEffect, useState } from "react";

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

const typeOptionsByCategory = {
  haircare: [
    "Hair Wax",
    "Hair Gel",
    "Hair Spray",
    "Hair Powder",
    "Hair Mousse",
    "Pomade",
    "Hair Cream",
    "Hair Tonic",
    "Shampoo",
    "Sea Salt Spray",
    "Foam",
    "Styling Cream",
    "Hair Clay",
    "Hair Paste",
    "Hair Oil",
  ],
  beardshaving: [
    "Beard Oil",
    "Beard Shampoo",
    "Beard Conditioner",
    "Beard Wax",
    "Shaving Gel",
    "Shaving Cream",
    "Razor Blades",
    "Aftershave",
    "Bump Repair Spray",
  ],
  skincare: ["Face Scrub", "Face Tonic", "Clay Mask", "Coffee Scrub"],
  fragrance: ["Cologne", "Aftershave Cologne", "Cream Cologne"],
};

const normalizeCategoryKey = (value) =>
  value
    .toString()
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");

const defaultTypeOptions = [
  "Hair Wax",
  "Hair Gel",
  "Hair Spray",
  "Hair Powder",
  "Hair Mousse",
  "Pomade",
  "Hair Cream",
  "Hair Tonic",
  "Shampoo",
  "Sea Salt Spray",
  "Foam",
  "Styling Cream",
  "Hair Clay",
  "Hair Paste",
  "Hair Oil",
  "Beard Oil",
  "Beard Shampoo",
  "Beard Conditioner",
  "Beard Wax",
  "Shaving Gel",
  "Shaving Cream",
  "Razor Blades",
  "Aftershave",
  "Bump Repair Spray",
  "Cologne",
  "Aftershave Cologne",
  "Cream Cologne",
  "Face Scrub",
  "Face Tonic",
  "Clay Mask",
  "Coffee Scrub",
];

const brandOptions = [
  "Redone",
  "Gummy",
  "Astra",
  "Derby",
  "Dorco",
  "Permasharp",
];

// Convert navbar URL category into exact DB category value
const categoryMap = {
  haircare: "HairCare",
  beardshaving: "Beard & Shaving",
  skincare: "SkinCare",
  fragrance: "Fragrance",
};

const ProductList = () => {
  const { searchterm } = useParams();
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("newest");

  const dbCategory = searchterm ? categoryMap[searchterm.toLowerCase()] : "";

  const selectedCategory = searchterm ? normalizeCategoryKey(searchterm) : "";
  const selectedTypeOptions = searchterm
    ? typeOptionsByCategory[selectedCategory] || []
    : defaultTypeOptions;

  useEffect(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      type: "",
    }));
  }, [selectedCategory]);

  const handleFilters = (e) => {
    const { name, value } = e.target;

    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSort("newest");
  };

  const formatTitle = (value) => {
    if (!value) return "All Products";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div
      className="min-h-screen px-4 py-10 sm:px-6 lg:px-8"
      style={{ backgroundColor: THEME.BG }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}


        {/* Filter + Sort Panel */}
        <div
          className="mb-10 rounded-[2rem] p-5 md:p-6"
          style={{
            backgroundColor: THEME.CARD,
            border: `1px solid ${THEME.BORDER}`,
            boxShadow: "0 16px 45px rgba(74,49,95,0.08)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* Filters */}
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.HEADING }}
                >
                  Product Type
                </label>

                <select
                  name="type"
                  value={filters.type || ""}
                  onChange={handleFilters}
                  className="w-full rounded-2xl px-4 py-3 outline-none transition-all"
                  style={{
                    backgroundColor: "#F8F5F1",
                    color: THEME.TEXT,
                    border: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  <option value="">All Types</option>

                  {selectedTypeOptions.length > 0 ? (
                    selectedTypeOptions.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No types available
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.HEADING }}
                >
                  Brand
                </label>

                <select
                  name="brand"
                  value={filters.brand || ""}
                  onChange={handleFilters}
                  className="w-full rounded-2xl px-4 py-3 outline-none transition-all"
                  style={{
                    backgroundColor: "#F8F5F1",
                    color: THEME.TEXT,
                    border: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  <option value="">All Brands</option>

                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] lg:w-[420px]">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: THEME.HEADING }}
                >
                  Sort Products
                </label>

                <select
                  name="price"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 outline-none transition-all"
                  style={{
                    backgroundColor: "#F8F5F1",
                    color: THEME.TEXT,
                    border: `1px solid ${THEME.BORDER}`,
                  }}
                >
                  <option value="newest">Newest</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                </select>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="h-12 self-end rounded-xl px-6 text-sm font-medium transition-all duration-300 hover:opacity-90"
                style={{
                  backgroundColor: THEME.PRIMARY,
                  color: "#FFFFFF",
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="mt-5 flex flex-wrap gap-3">
            {filters.type && (
              <span
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: THEME.SOFT_GREEN,
                  color: THEME.PRIMARY,
                }}
              >
                Type: {filters.type}
              </span>
            )}

            {filters.brand && (
              <span
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: THEME.SOFT_GREEN,
                  color: THEME.PRIMARY,
                }}
              >
                Brand: {filters.brand}
              </span>
            )}

            <span
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "rgba(239,198,90,0.22)",
                color: THEME.PRIMARY_DARK,
              }}
            >
              Sort:{" "}
              {sort === "newest"
                ? "Newest"
                : sort === "asc"
                  ? "Low to High"
                  : "High to Low"}
            </span>
          </div>
        </div>
      </div>

      <Products
        category={dbCategory}
        filters={filters}
        sort={sort}
        query={searchterm}
      />
    </div>
  );
};

export default ProductList;