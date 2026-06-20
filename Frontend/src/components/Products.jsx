import { useEffect, useState } from "react";
import Product from "./Product";
import PropTypes from "prop-types";
import { userRequest } from "../requestMethods";
import { Link } from "react-router-dom";

/** Fetches, filters, and paginates the storefront product collection. */
const Products = ({ filters, sort, category, query }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


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

 useEffect(() => {
  const getProducts = async () => {
    setIsLoading(true);
    setPage(1);

    try {
      // Build query params for DB filtering
      const params = new URLSearchParams();

      params.append("page", "1");
      params.append("limit", "32");

      // Category comes from navbar route and is converted to DB category
      if (category) params.append("category", category);

      // Filters come from dropdowns
      if (filters?.type) params.append("type", filters.type);
      if (filters?.brand) params.append("brand", filters.brand);

      // Sort comes from sort dropdown
      if (sort) params.append("sort", sort);

      const res = await userRequest.get(`/products?${params.toString()}`);

      setProducts(res.data);
      setFilteredProducts(res.data);
      setHasMore(res.data.length === 32);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  getProducts();
}, [category, filters, sort]);

const loadMoreProducts = async () => {
  if (isLoadingMore || !hasMore) return;

  setIsLoadingMore(true);

  try {
    const nextPage = page + 1;

    // Build query params for next page with same filters
    const params = new URLSearchParams();

    params.append("page", nextPage);
    params.append("limit", "32");

    if (category) params.append("category", category);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.brand) params.append("brand", filters.brand);
    if (sort) params.append("sort", sort);

    const res = await userRequest.get(`/products?${params.toString()}`);

    const newProducts = res.data;

    setProducts((prevProducts) => [...prevProducts, ...newProducts]);
    setFilteredProducts((prevProducts) => [...prevProducts, ...newProducts]);
    setPage(nextPage);
    setHasMore(newProducts.length === 32);
  } catch (error) {
  } finally {
    setIsLoadingMore(false);
  }
};

 
  if (isLoading) {
    return (
      <div
        id="premium-collection"
        className="relative min-h-screen overflow-hidden px-4 py-12"
        style={{ backgroundColor: THEME.BG }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div
              className="mb-4 inline-block rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: THEME.CARD,
                color: THEME.PRIMARY,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              {query ? " " : " ✨ Discover Our Collection"}
             
            </div>

            <h2
              className="mb-4 text-4xl font-bold md:text-5xl"
              style={{ color: THEME.HEADING }}
            >
              {query ? " " : "Curated Beauty Selection"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: THEME.CARD,
                  border: `1px solid ${THEME.BORDER}`,
                  boxShadow: "0 14px 35px rgba(74,49,95,0.08)",
                }}
              >
                <div
                  className="h-80"
                  style={{ backgroundColor: "#EFE9E2" }}
                ></div>

                <div className="p-6">
                  <div
                    className="mb-3 h-6 rounded-full"
                    style={{ backgroundColor: "#EFE9E2" }}
                  ></div>
                  <div
                    className="mb-4 h-4 w-3/4 rounded-full"
                    style={{ backgroundColor: "#EFE9E2" }}
                  ></div>
                  <div
                    className="mb-5 h-4 w-1/2 rounded-full"
                    style={{ backgroundColor: "#EFE9E2" }}
                  ></div>
                  <div className="flex items-center justify-between">
                    <div
                      className="h-6 w-1/3 rounded-full"
                      style={{ backgroundColor: "#EFE9E2" }}
                    ></div>
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{ backgroundColor: THEME.SOFT_GREEN }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="premium-collection"
      className="relative min-h-screen overflow-hidden px-4 py-12"
      style={{ backgroundColor: THEME.BG }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 top-10 h-80 w-80 rounded-full blur-[120px]"
          style={{ backgroundColor: "rgba(239,198,90,0.18)" }}
        ></div>
        <div
          className="absolute right-0 top-1/3 h-96 w-96 rounded-full blur-[140px]"
          style={{ backgroundColor: "rgba(74,49,95,0.10)" }}
        ></div>
        <div
          className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full blur-[120px]"
          style={{ backgroundColor: "rgba(239,198,90,0.14)" }}
        ></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <div
            className="mb-4 inline-block rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              backgroundColor: THEME.CARD,
              color: THEME.PRIMARY,
              border: `1px solid ${THEME.BORDER}`,
              boxShadow: "0 10px 30px rgba(74,49,95,0.06)",
            }}
          >
            ✂️ {query ? "Search Results" : "Premium Collection"}
          </div>

          <h2
            className="mb-4 text-5xl font-bold tracking-tight md:text-6xl"
            style={{ color: THEME.HEADING }}
          >
            {query ? " " : "Professional Grooming Products"}
          </h2>

          <p
            className="mx-auto max-w-2xl text-lg leading-relaxed"
            style={{ color: THEME.TEXT }}
          >
              {query ? " " : `Explore premium barber-approved hair care, beard care, styling
            products and grooming essentials.`}
            
          </p>

                {/* {query ? " " : <div
            className="mt-6 inline-flex items-center rounded-full px-6 py-3 shadow-sm"
            style={{
              backgroundColor: THEME.CARD,
              border: `1px solid ${THEME.BORDER}`,
              color: THEME.TEXT,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              style={{ color: THEME.PRIMARY }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>

            
            <span>
              Showing{" "}
              <span style={{ color: THEME.PRIMARY }} className="font-semibold">
                {filteredProducts.length}
              </span>{" "}
              products
              {hasMore && !isLoading && (
                <span className="ml-2" style={{ color: THEME.GOLD }}>
                  • More available
                </span>
              )}
            </span>
          </div>} */}
          
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="mx-auto max-w-md rounded-3xl p-12 shadow-lg"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
              }}
            >
              <div
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ backgroundColor: THEME.SOFT_GREEN }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  style={{ color: THEME.PRIMARY }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3
                className="mb-3 text-2xl font-semibold"
                style={{ color: THEME.HEADING }}
              >
                No Products Found
              </h3>

              <p className="mb-6" style={{ color: THEME.TEXT }}>
                Try changing your search or filters to discover more products.
              </p>

              <button
                className="rounded-full px-6 py-3 font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  backgroundColor: THEME.PRIMARY,
                  color: "#FFFFFF",
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="group block transition-all duration-500 hover:-translate-y-2"
                >
                  <div
                    className="flex h-full flex-col overflow-hidden rounded-[28px] transition-all duration-500"
                    style={{
                      backgroundColor: THEME.CARD,
                      border: `1px solid ${THEME.BORDER}`,
                      boxShadow: "0 16px 40px rgba(74,49,95,0.09)",
                    }}
                  >
                    <Product product={product} />
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-16 text-center">
                <button
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                  className="group mx-auto flex items-center justify-center rounded-full px-8 py-4 font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                  style={{
                    backgroundColor: THEME.PRIMARY,
                    color: "#FFFFFF",
                    boxShadow: "0 12px 25px rgba(74,49,95,0.22)",
                  }}
                >
                  {isLoadingMore ? (
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span>Load More Products</span>
                      <svg
                        className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-y-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {!isLoadingMore && (
                  <p className="mt-4 text-sm" style={{ color: THEME.MUTED }}>
                    Loaded {page * 32} products • Click to load more
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {!hasMore && filteredProducts.length > 0 && (
          <div className="mt-12 text-center">
            <div
              className="inline-flex items-center rounded-full px-6 py-3 shadow-sm"
              style={{
                backgroundColor: THEME.CARD,
                border: `1px solid ${THEME.BORDER}`,
                color: THEME.TEXT,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 h-5 w-5"
                style={{ color: THEME.PRIMARY }}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>

              <span>
                You've reached the end. All {filteredProducts.length} products
                are displayed.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Products.propTypes = {
  cat: PropTypes.string,
  filters: PropTypes.object,
  sort: PropTypes.string,
  query: PropTypes.string,
};

export default Products;
