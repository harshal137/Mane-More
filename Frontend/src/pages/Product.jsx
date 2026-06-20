import StarRatings from "react-star-ratings";
import {
  FaMinus,
  FaPlus,
  FaHeart,
  FaShare,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaPause,
  FaPlay,
  FaShoppingCart,
  FaTruck,
  FaBoxOpen,
  FaPen,
  FaTimesCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { userRequest } from "../requestMethods";
import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { addProduct } from "../redux/cartRedux";
import { showAverageRating } from "../components/Ratings";
import { addToWishlist, removeFromWishlist } from "../redux/wishlistRedux";

/** Displays a product detail page and manages size-aware cart actions. */
const Product = () => {

  const location = useLocation();
  const navigate = useNavigate();

  // Product id comes from URL like: /product/PRODUCT_ID
  const id = location.pathname.split("/")[2];

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const wishlist = useSelector((state) => state.wishlist.products);

  const [product, setProduct] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [autoSlide, setAutoSlide] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Review form states
  const [showReviewBox, setShowReviewBox] = useState(false);
  const [reviewStar, setReviewStar] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const autoSlideRef = useRef(null);
  const reviewsRef = useRef(null);

  const isWishlisted = wishlist.some((item) => item._id === product._id);

  const handleWishlist = (e) => {
    e.preventDefault();

    if (!product._id) return;

    if (isWishlisted) {
      dispatch(removeFromWishlist(product._id));
      toast.info("Removed from wishlist");
    } else {
      dispatch(addToWishlist(product));
      toast.success("Added to wishlist");
    }
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  let price;

  const formatPrice = (value) => `\u00a3${Number(value || 0).toFixed(2)}`;

  const isHairExtensionProduct = useMemo(
    () =>
      (product.categories || []).some((category) => {
        const normalizedCategory = String(category)
          .toLowerCase()
          .replace(/\s+/g, "");

        return (
          normalizedCategory === "hairextension" ||
          normalizedCategory === "hairextensions" ||
          normalizedCategory === "extension" ||
          normalizedCategory.includes("extension")
        );
      }),
    [product.categories]
  );

  const availableSizes = useMemo(
    () =>
      Array.isArray(product.sizes)
        ? product.sizes.filter(
            (size) =>
              size?.label &&
              size.price !== undefined &&
              !Number.isNaN(Number(size.price))
          )
        : [],
    [product.sizes]
  );

  const shouldShowSizeSelect = isHairExtensionProduct && availableSizes.length > 0;

  // Backend API base used to build image URLs
  const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

  const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

  /*
    PRODUCT DATA FETCH FROM DATABASE
    This request goes to your backend route:
    GET /products/find/:id

    Full URL example:
    http://localhost:4000/api/v1/products/find/PRODUCT_ID

    Backend then fetches product data from MongoDB using this product id.
  */
  useEffect(() => {
    const getProduct = async () => {
      try {
        const res = await userRequest.get("/products/find/" + id);
        setProduct(res.data);

        if (res.data.img && res.data.img.length > 0) {
          setSelectedImage(0);
        }
      } catch (error) {
        toast.error("Failed to load product");
      }
    };

    getProduct();
  }, [id]);

  useEffect(() => {
    // Default hair extension products to the first saved size option.
    if (shouldShowSizeSelect) {
      setSelectedSize((currentSize) => {
        const stillExists = availableSizes.some(
          (size) => size.label === currentSize?.label
        );

        return stillExists ? currentSize : availableSizes[0];
      });
    } else {
      setSelectedSize(null);
    }
  }, [availableSizes, shouldShowSizeSelect, product._id]);

  // Convert backend image paths into usable browser image URLs
  const productImages = (product.img || []).map((img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("//")) return img;

    if (img.startsWith("./")) {
      const clean = img.replace(/^\.\//, "");
      return `${API_ORIGIN}/data/${clean}`;
    }

    if (!img.startsWith("/")) {
      return `${API_ORIGIN}/${img}`;
    }

    return `${API_ORIGIN}${img}`;
  });

  // Auto image slider
  useEffect(() => {
    if (!autoSlide || !productImages.length || productImages.length <= 1 || isHovering)
      return;

    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }

    autoSlideRef.current = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % productImages.length);
    }, 6000);

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [autoSlide, productImages.length, isHovering]);

  const handleQuantity = (action) => {
    if (action === "dec") {
      setQuantity((prev) => (prev === 1 ? 1 : prev - 1));
    } else {
      setQuantity((prev) => prev + 1);
    }
  };

  const nextImage = () => {
    if (productImages.length > 0) {
      setSelectedImage((prev) => (prev + 1) % productImages.length);
      setAutoSlide(false);
    }
  };

  const prevImage = () => {
    if (productImages.length > 0) {
      setSelectedImage(
        (prev) => (prev - 1 + productImages.length) % productImages.length
      );
      setAutoSlide(false);
    }
  };

  const handleImageSelect = (index) => {
    setSelectedImage(index);
    setAutoSlide(false);
  };

  const handlePrice = (
    originalPrice,
    discountedPrice,
    wholePrice,
    minimumQuantity,
    quantity
  ) => {
    if (quantity > minimumQuantity && discountedPrice) {
      price = wholePrice;
      return price;
    }

    if (quantity > minimumQuantity && originalPrice) {
      price = wholePrice;
      return price;
    }

    if (discountedPrice) {
      price = discountedPrice;
      return price;
    }

    price = originalPrice;
    return price;
  };

  const currentPrice = handlePrice(
    product.originalPrice,
    product.discountedPrice,
    product.wholesalePrice,
    product.wholesaleMinimumQuantity,
    quantity
  );

  const displayPrice = shouldShowSizeSelect && selectedSize
    ? Number(selectedSize.price)
    : currentPrice;

  const displayStock = shouldShowSizeSelect && selectedSize?.stock !== undefined
    ? Number(selectedSize.stock)
    : Number(product.stock || 0);

  const handleAddToCart = () => {
    dispatch(
      addProduct({
        ...product,
        quantity,
        price: displayPrice,
        selectedSize: selectedSize?.label || null,
        selectedSizePrice: selectedSize ? Number(selectedSize.price) : null,
        email: user.currentUser?.email || "guest@gmail.com",
      })
    );

    toast.success("Product added to cart successfully!");
  };

  const handleBuyNow = () => {
    dispatch(
      addProduct({
        ...product,
        quantity,
        price: displayPrice,
        selectedSize: selectedSize?.label || null,
        selectedSizePrice: selectedSize ? Number(selectedSize.price) : null,
        email: user.currentUser?.email || "guest@gmail.com",
      })
    );

    navigate("/cart");
  };



  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.desc,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied!");
    }
  };

  /*
    WRITE REVIEW REQUEST
    This request goes to your backend route:
    PUT /products/rating/:productId

    Full URL example:
    http://localhost:4000/api/v1/products/rating/PRODUCT_ID

    Backend should save:
    {
      star: reviewStar,
      comment: reviewComment,
      postedBy: user id or user name
    }

    Important:
    Your backend must have this route. If your route name is different,
    only change the URL below.
  */
  const handleSubmitReview = async () => {
    if (!user.currentUser) {
      toast.error("Please login to write a review");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write your review");
      return;
    }

    try {
      setReviewLoading(true);

      const reviewData = {
        star: reviewStar,
        comment: reviewComment,
        postedBy:
          user.currentUser.username ||
          user.currentUser.name ||
          user.currentUser.email ||
          user.currentUser._id,
      };

      const res = await userRequest.put(`/products/rating/${id}`, reviewData);

      setProduct(res.data);
      setReviewComment("");
      setReviewStar(5);
      setShowReviewBox(false);

      toast.success("Review added successfully!");
    } catch (error) {
      toast.error("Failed to add review");
    } finally {
      setReviewLoading(false);
    }
  };

  const ratings = product.ratings || [];

  const averageRating =
    ratings.length > 0
      ? (
        ratings.reduce((sum, item) => sum + Number(item.star || 0), 0) /
        ratings.length
      ).toFixed(1)
      : "0.0";

  const ratingCount = (star) =>
    ratings.filter((item) => Number(item.star) === star).length;

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-4 pb-10 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      <div className="max-w-7xl mx-auto space-y-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <FaChevronLeft />
          Back
        </button>


        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-xl p-6 lg:p-8 shadow-sm">
          {/* Left Images */}
          <div>
            <div
              className="relative h-[430px] rounded-lg overflow-hidden bg-gray-100 group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* {product.discountedPrice && product.originalPrice && (
                <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -
                  {Math.round(
                    ((product.originalPrice - product.discountedPrice) /
                      product.originalPrice) *
                    100
                  )}
                  %
                </div>
              )} */}

              {productImages.length > 0 ? (
                <img
                  src={productImages[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}

              {productImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white text-gray-800 w-10 h-10 rounded-full shadow flex items-center justify-center"
                  >
                    <FaChevronLeft />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-gray-800 w-10 h-10 rounded-full shadow flex items-center justify-center"
                  >
                    <FaChevronRight />
                  </button>

                  <button
                    onClick={() => setAutoSlide(!autoSlide)}
                    className="absolute top-4 right-4 bg-white text-gray-800 w-10 h-10 rounded-full shadow flex items-center justify-center"
                  >
                    {autoSlide ? <FaPause /> : <FaPlay />}
                  </button>
                </>
              )}
            </div>

            {/* Image Options / Thumbnails */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3 mt-5">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(index)}
                    className={`h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index
                      ? "border-black"
                      : "border-gray-200"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Product Details */}
          <div className="flex flex-col">
            {/* {product.discountedPrice && (
              <span className="w-fit bg-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-md mb-4">
                BEST SELLER
              </span>
            )} */}

            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              {product.title}
            </h1>

            <button
              type="button"
              onClick={scrollToReviews}
              className="flex items-center gap-3 mb-5 text-left"
              aria-label="Go to product reviews"
            >
              {showAverageRating(product)}
              <span className="text-gray-600 text-sm">
                {averageRating} ({ratings.length} reviews)
              </span>
            </button>

            <p className="text-gray-700 leading-7 mb-6">{product.desc}</p>

            {shouldShowSizeSelect && (
              <div className="mb-5">
                <label
                  htmlFor="hair-extension-size"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Size / Length
                </label>

                <select
                  id="hair-extension-size"
                  value={selectedSize?.label || ""}
                  onChange={(e) => {
                    const size = availableSizes.find(
                      (item) => item.label === e.target.value
                    );
                    setSelectedSize(size || null);
                  }}
                  className="w-full md:max-w-md rounded-md border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                >
                  {availableSizes.map((size) => (
                    <option key={size.label} value={size.label}>
                      {size.label} - {formatPrice(size.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-4xl font-bold text-red-600">
                {formatPrice(displayPrice)}
              </span>

              {!shouldShowSizeSelect && product.discountedPrice && product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {displayStock > 5 ? (
              <p className="text-green-700 font-semibold flex items-center gap-2 mb-3">
                <FaCheck />
                In Stock
              </p>
            ) : displayStock > 0 ? (
              <p className="text-amber-600 font-semibold flex items-center gap-2 mb-3">
                <FaExclamationTriangle />
                Only {displayStock} left in stock
              </p>
            ) : (
              <p className="text-red-600 font-semibold flex items-center gap-2 mb-3">
                <FaTimesCircle />
                Out of Stock
              </p>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <p className="font-semibold mb-2">Quantity</p>
              <div className="flex items-center">
                <button
                  onClick={() => handleQuantity("dec")}
                  className="w-10 h-10 bg-gray-100 rounded-l-md flex items-center justify-center"
                >
                  <FaMinus />
                </button>

                <span className="w-14 h-10 border-y border-gray-200 flex items-center justify-center font-semibold">
                  {quantity}
                </span>

                <button
                  onClick={() => handleQuantity("inc")}
                  className="w-10 h-10 bg-gray-100 rounded-r-md flex items-center justify-center"
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <button
              disabled={displayStock === 0}
              onClick={handleAddToCart}
              className="w-full bg-black text-white py-4 rounded-md font-bold flex items-center justify-center gap-3 mb-4 hover:bg-gray-900"
            >
              <FaShoppingCart /> ADD TO CART
            </button>

            <button
              disabled={displayStock === 0}
              onClick={handleBuyNow}
              className="w-full bg-orange-600 text-white py-4 rounded-md font-bold mb-6 hover:bg-orange-700"
            >
              BUY NOW
            </button>

            <div className="grid grid-cols-2 gap-4 text-center text-sm mb-6">
              <div className="flex flex-col items-center gap-2">
                <FaTruck className="text-xl" />
                <span>
                  {isHairExtensionProduct
                    ? "No Returns or Exchanges"
                    : "7-Day Returns"}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <FaCheck className="text-xl" />
                <span>Secure Checkout</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleWishlist}
                className="flex-1 border py-3 rounded-md flex items-center justify-center gap-2 transition-all duration-300"
                style={{
                  borderColor: isWishlisted ? "#DC2626" : "#E8E1DA",
                  color: isWishlisted ? "#DC2626" : "#4A315F",
                  backgroundColor: isWishlisted ? "#FEE2E2" : "#FFFFFF",
                }}
              >
                <FaHeart />
                {isWishlisted ? "Wishlisted" : "Wishlist"}
              </button>

              <button
                onClick={handleShare}
                className="flex-1 border border-gray-200 py-3 rounded-md flex items-center justify-center gap-2"
              >
                <FaShare /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Features / Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl p-6 lg:p-8 shadow-sm">
          <div className="border-r border-gray-200 last:border-r-0">
            <h3 className="font-bold mb-5">KEY FEATURES</h3>

            <ul className="space-y-3 text-gray-700">
              {(product.keyFeatures || product.features || [
                product.brand && `Brand: ${product.brand}`,
                product.categories?.[0] && `Category: ${product.categories[0]}`,
                Array.isArray(product.type)
                  ? product.type.filter(Boolean).length && `Type: ${product.type.filter(Boolean).join(", ")}`
                  : product.type && `Type: ${product.type}`,
                "Quality checked product",
                "Easy to use",
              ])
                .filter(Boolean)
                .map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <FaCheck className="text-black" />
                    {item}
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-5">ITEMS PER BOX</h3>
            <FaBoxOpen className="text-5xl mb-4" />
            <p className="font-bold">
              1
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div
          ref={reviewsRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-xl p-6 lg:p-8 shadow-sm scroll-mt-24"
        >
          <div>
            <h3 className="text-2xl font-bold mb-8">REVIEWS</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-6xl font-bold">{averageRating}</h2>

                <StarRatings
                  rating={Number(averageRating)}
                  starDimension="24px"
                  starRatedColor="#fbbf24"
                  starSpacing="2px"
                />

                <p className="text-gray-600 mt-2">({ratings.length} reviews)</p>
              </div>

              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span>{star}</span>
                    <span className="text-yellow-500">★</span>

                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: ratings.length
                            ? `${(ratingCount(star) / ratings.length) * 100}%`
                            : "0%",
                        }}
                      ></div>
                    </div>

                    <span className="w-8 text-right">{ratingCount(star)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowReviewBox(!showReviewBox)}
              className="bg-black text-white px-6 py-3 rounded-md font-bold flex items-center gap-3 mb-6"
            >
              <FaPen /> WRITE A REVIEW
            </button>

            {showReviewBox && (
              <div className="border border-gray-200 rounded-xl p-5 mb-6">
                <p className="font-semibold mb-3">Your Rating</p>

                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewStar(star)}
                      className={`text-3xl ${star <= reviewStar ? "text-yellow-400" : "text-gray-300"
                        }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write your review here..."
                  className="w-full min-h-[120px] border border-gray-200 rounded-lg p-4 outline-none focus:border-black mb-4"
                />

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewLoading}
                  className="bg-orange-600 text-white px-6 py-3 rounded-md font-bold disabled:opacity-60"
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}

            <div className="space-y-5 max-h-[360px] overflow-y-auto pr-2">
              {ratings.length > 0 ? (
                ratings.map((rating, index) => (
                  <div key={index} className="border-b border-gray-100 pb-5">
                    <StarRatings
                      rating={Number(rating.star)}
                      starDimension="18px"
                      starRatedColor="#fbbf24"
                      starSpacing="2px"
                    />

                    <div className="flex items-center gap-2 mt-2 mb-2">
                      <p className="font-bold">
                        {rating.postedBy || "Customer"}
                      </p>

                      <span className="text-green-600 text-xs font-semibold">
                        Verified Buyer
                      </span>
                    </div>

                    <p className="text-gray-700">
                      {rating.comment || "No comment provided"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No reviews yet. Be the first to review this product.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Extra Image Options */}
        {productImages.length > 0 && (
          <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <h3 className="text-center font-bold mb-6">IMAGE OPTIONS</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {productImages.slice(0, 4).map((img, index) => (
                <div key={index}>
                  <div className="h-56 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={img}
                      alt={`${product.title} option ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-center mt-2 text-sm">
                    Image Option {index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
