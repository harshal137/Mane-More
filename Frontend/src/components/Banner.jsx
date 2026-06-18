import React, { useState, useEffect } from "react";
import { userRequest } from "../requestMethods";
import { useNavigate } from "react-router-dom";
import { trackButtonClick } from "../utils/analytics";


const BG = '#F8F7F5';
const CARD = '#FFFFFF';
const PRIMARY = '#3E2C4F';
const TEXT = '#2F2A35';
const MUTED = '#6D6875';
const BORDER = '#ECEAE6';
const ACCENT = '#DDE7C7';
const HERO_BG = "/hero-bg2.jpg";

const Banner = () => {
  const [bannerData, setBannerData] = useState(null);
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Default title options if not provided from backend
  const defaultTitleOptions = [
    "PROFESSIONAL BARBER GRADE",
    "PREMIUM HAIR STYLING",
    "HEALTHY HAIR CARE",
    "SALON QUALITY RESULTS"
  ];

  // Show popup when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Fetch banner data from database
  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const response = await userRequest.get("/banner");
        const data = response.data;

        // Ensure we have proper banner data structure
        const bannerData = {
          gifUrl: data.gifUrl || "https://c.tenor.com/3i4N_qXG5m4AAAAC/barber-shop.gif",
          title: data.title || "GOOD FOR HAIR & SKIN",
          subtitle: data.subtitle || "Experience the transformative power",
          description: data.description || "Elevate your grooming routine with premium hair care and barber products, formulated to nourish, style, and maintain healthy-looking hair with professional-quality results.",
          titleOptions: data.titleOptions || defaultTitleOptions
        };

        setBannerData(bannerData);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch banner data:", error);
        // Fallback data if fetch fails
        setBannerData({
          gifUrl: "https://c.tenor.com/3i4N_qXG5m4AAAAC/barber-shop.gif",
          title: "GOOD FOR HAIR &SKIN",
          subtitle: "Experience the transformative power",
          description: "Elevate your grooming routine with premium hair care and barber products, formulated to nourish, style, and maintain healthy-looking hair with professional-quality results.",
          titleOptions: defaultTitleOptions
        });
        setIsLoading(false);
      }
    };

    fetchBannerData();
  }, []);

  // Improved typing animation effect
  useEffect(() => {
    if (!bannerData) return;

    let timeout;
    let charIndex = 0;

    const currentTitles = bannerData.titleOptions || defaultTitleOptions;
    const currentTitle = currentTitles[currentTitleIndex];
    const typingSpeed = 150;
    const deletingSpeed = 70;
    const fullTextDelay = 2800;
    const nextTitleDelay = 500;

    const typeText = () => {
      if (charIndex <= currentTitle.length) {
        setDisplayedTitle(currentTitle.substring(0, charIndex));
        charIndex++;
        timeout = setTimeout(typeText, typingSpeed);
      } else {
        setIsTyping(false);
        timeout = setTimeout(() => {
          deleteText();
        }, fullTextDelay);
      }
    };

    const deleteText = () => {
      if (charIndex >= 0) {
        setDisplayedTitle(currentTitle.substring(0, charIndex));
        charIndex--;
        timeout = setTimeout(deleteText, deletingSpeed);
      } else {
        timeout = setTimeout(() => {
          setCurrentTitleIndex((prev) => (prev + 1) % currentTitles.length);
          setIsTyping(true);
        }, nextTitleDelay);
      }
    };

    if (isTyping) {
      typeText();
    } else {
      deleteText();
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [bannerData, currentTitleIndex, isTyping]);

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleDiscoverProducts = () => {
    navigate("/#premium-collection");
  };

  const handleLearnMore = () => {
    navigate("/about");
  };

  const handleCreateTimetable = () => {
    setShowPopup(false);
    trackButtonClick("create_hair_care_plan", {
      source: "welcome_popup"
    });
    navigate("/hair-care-plan");
  };

  const handleCreateCustomPackage = () => {
    setShowPopup(false);
    trackButtonClick("build_grooming_kit", {
      source: "welcome_popup"
    });
    navigate("/packages");
  };

  const handleFreeSkinAssessment = () => {
    setShowPopup(false);
    trackButtonClick("free_style_consultation", {
      source: "welcome_popup"
    });
    navigate("/style-consultation");
  };

  const handlePopupMainAction = () => {
    closePopup();
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-pink-100 via-white to-pink-50 py-24 px-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading amazing offers...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Main Banner Section */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="Long hair styling"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(28,20,16,0.86), rgba(57,39,31,0.62), rgba(248,247,245,0.28))",
            }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full px-8 py-24">
          {/* Left side: Text */}
          <div className="space-y-6"
            style={{ color: "#F8F1E7" }}>
            <h3 className="uppercase tracking-[0.35em] text-sm font-semibold" style={{ color: "#EFC65A" }}>
              {bannerData.subtitle}
            </h3>

            {/* Improved Animated title */}
            <div className="relative">
              <h1 className="text-6xl font-bold leading-tight min-h-[150px] flex items-center" style={{ color: "#FFF7ED" }}>
                <span>
                  {displayedTitle}
                </span>
                <span className={`inline-block w-1 h-12 bg-amber-300 ml-2 align-middle ${isTyping ? 'animate-pulse' : 'opacity-0'
                  } transition-opacity`}></span>
              </h1>

              {/* Subtle background text effect */}
              <div className="absolute inset-0 flex items-center opacity-5 pointer-events-none">
                <span className="text-7xl font-black whitespace-nowrap" style={{ color: "#F8F1E7" }}>
                  {bannerData.titleOptions?.[currentTitleIndex] || "BEAUTIFUL SKIN"}
                </span>
              </div>
            </div>

            {/* Static description text */}
            <div className="mt-8 max-w-xl">
              <p className="text-xl leading-relaxed"
              style={{ color: "#F4E9DA" }}>
                {bannerData.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <button
                onClick={handleDiscoverProducts}
                style={{
                  backgroundColor: "#EFC65A",
                  color: "#2F211B"
                }}
                className="px-8 py-4 rounded-2xl font-semibold"      >
                Discover Products
              </button>
              <button
                onClick={handleLearnMore}
                style={{
                  backgroundColor: "rgba(255,247,237,0.12)",
                  color: "#FFF7ED",
                  border: "1px solid rgba(255,247,237,0.35)"
                }}
                className="px-8 py-4 rounded-2xl font-semibold"    >
                Learn More
              </button>
            </div>
          </div>

          {/* Right side: Barber theme visual */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg">

              {/* Glow Effects */}
              <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl"></div>
              <div className="absolute right-0 bottom-10 h-44 w-44 rounded-full bg-purple-900/30 blur-3xl"></div>

              {/* Main Card */}
              <div
                className="relative overflow-hidden rounded-[2.5rem] backdrop-blur-xl shadow-[0_50px_120px_rgba(15,23,42,0.45)]"
                style={{
                  background: "rgba(245,228,214,0.75)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <div className="p-8">

                  {/* Badge */}
                  <div className="inline-flex items-center rounded-full bg-[#F4C95D]/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#432C5A]">
                    Barber Premium Edition
                  </div>

                  {/* Header */}
                  <div className="mt-8 flex items-center gap-4">

                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg"
                      style={{
                        background: "#432C5A",
                        border: "1px solid rgba(244,201,93,0.2)",
                      }}
                    >
                      <span className="text-3xl">✂️</span>
                    </div>

                    <div>
                      <h2
                        className="text-3xl font-bold leading-tight"
                        style={{ color: "#111827" }}
                      >
                        Healthy Hair Starts Here
                      </h2>

                      <p
                        className="mt-3 max-w-sm text-sm"
                        style={{ color: "#4B5563" }}
                      >
                        Premium hair care products designed to nourish, protect and
                        enhance every hair type.
                      </p>
                    </div>
                  </div>

                  {/* Product Cards */}
                  <div className="mt-10 grid gap-4 sm:grid-cols-2">

                    {/* Card 1 */}
                    <div
                      className="rounded-[2rem] p-5 shadow-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(67,44,90,0.95) 0%, rgba(33,27,56,0.95) 100%)",
                        border: "1px solid rgba(244,201,93,0.15)",
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#F4C95D]">
                        Haircare
                      </p>

                      <h3 className="mt-3 text-lg font-bold text-white">
                        Revitalizing Shampoo
                      </h3>

                      <p className="mt-2 text-sm text-white/75">
                        Deep cleanse with nutrient-rich botanicals for stronger, fuller
                        hair.
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div
                      className="rounded-[2rem] p-5 shadow-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(67,44,90,0.95) 0%, rgba(33,27,56,0.95) 100%)",
                        border: "1px solid rgba(244,201,93,0.15)",
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#F4C95D]">
                        Grooming
                      </p>

                      <h3 className="mt-3 text-lg font-bold text-white">
                        Deep Repair Treatment
                      </h3>

                      <p className="mt-2 text-sm text-white/75">
                        Flexible hold and high shine for classic barber-crafted looks.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Bottom Fade */}
                <div
                  className="absolute inset-x-0 bottom-0 h-32"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(67,44,90,0.25), transparent)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Banner;
