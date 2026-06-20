import { FaPlus, FaTrash, FaSearch, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../requestMethods";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const NewProduct = () => {
  const navigate = useNavigate();

  const [selectedImages, setSelectedImages] = useState([]);
  const [inputs, setInputs] = useState({ items_per_box: 1 });
  const [sizes, setSizes] = useState([]);
  const [uploading, setUploading] = useState("Ready to upload");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [catalogOptions, setCatalogOptions] = useState({
    categories: [],
    brands: [],
    brandsByCategory: {},
    sizes: [],
    typesByCategory: {},
  });

  const [selectedOptions, setSelectedOptions] = useState({
    categories: [],
    type: [],
    size: [],
  });

  const [searchTerms, setSearchTerms] = useState({
    brand: "",
    categories: "",
    type: "",
    size: "",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCatalogOptions = async () => {
      try {
        const res = await userRequest.get("/catalog-options");
        setCatalogOptions({
          categories: res.data.categories || [],
          brands: res.data.brands || [],
          brandsByCategory: res.data.brandsByCategory || {},
          sizes: res.data.sizes || [],
          typesByCategory: res.data.typesByCategory || {},
        });
      } catch (error) {
      }
    };

    fetchCatalogOptions();
  }, []);

  const isHairExtensionCategory = (category) => {
    const normalizedCategory = String(category).toLowerCase().replace(/\s+/g, "");
    return (
      normalizedCategory === "hairextension" ||
      normalizedCategory === "hairextensions" ||
      normalizedCategory === "extension" ||
      normalizedCategory.includes("extension")
    );
  };

  const showProductSizes = selectedOptions.categories.some(isHairExtensionCategory);
  const classificationFields = showProductSizes
    ? ["type"]
    : ["type", "size"];

  const getTypeOptionsForCategories = (categories) => {
    const categoryTypes = categories.flatMap(
      (category) => catalogOptions.typesByCategory[category] || []
    );

    return [...new Set(categoryTypes)];
  };

  const getBrandOptionsForCategories = (categories) => {
    const categoryBrands = categories.flatMap(
      (category) => catalogOptions.brandsByCategory[category] || []
    );

    return categoryBrands.length
      ? [...new Set(categoryBrands)]
      : catalogOptions.brands;
  };

  const getOptionsForField = (field) => {
    if (field === "brand") {
      return getBrandOptionsForCategories(selectedOptions.categories);
    }

    if (field === "type") {
      return getTypeOptionsForCategories(selectedOptions.categories);
    }

    if (field === "categories") return catalogOptions.categories;
    if (field === "size") return catalogOptions.sizes;

    return [];
  };

  const getFilteredOptions = (field) => {
    const searchTerm = searchTerms[field].toLowerCase();
    const options = getOptionsForField(field);

    if (!searchTerm) return options;

    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm)
    );
  };

  const compressImageToWebP = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(resolve, "image/webp", quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const imageChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(
        0,
        4 - selectedImages.length
      );

      if (files.length === 0) {
        alert("You can only upload up to 4 images");
        return;
      }

      setUploading("Compressing images to WebP...");

      try {
        const compressedImages = await Promise.all(
          files.map(async (file) => {
            const compressedBlob = await compressImageToWebP(file);

            return {
              originalFile: file,
              compressedBlob,
              preview: URL.createObjectURL(compressedBlob),
              name: file.name.replace(/\.[^/.]+$/, ".webp"),
            };
          })
        );

        setSelectedImages((prev) => [...prev, ...compressedImages]);
        setUploading(`Added ${files.length} WebP image(s). Ready to upload.`);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error(error);
        setUploading("Error compressing images");
      }
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const updatedImages = [...prev];
      URL.revokeObjectURL(updatedImages[index].preview);
      updatedImages.splice(index, 1);
      return updatedImages;
    });
  };

  const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field, value) => {
    if (value && !selectedOptions[field].includes(value)) {
      const nextCategories =
        field === "categories" ? [...selectedOptions.categories, value] : selectedOptions.categories;

      setSelectedOptions((prev) => ({
        ...prev,
        [field]: [...prev[field], value],
        ...(field === "categories"
          ? {
              type: prev.type.filter((type) =>
                getTypeOptionsForCategories([...prev.categories, value]).includes(type)
              ),
              size: [...prev.categories, value].some(isHairExtensionCategory)
                ? []
                : prev.size,
            }
          : {}),
      }));

      if (
        field === "categories" &&
        inputs.brand &&
        !getBrandOptionsForCategories(nextCategories).includes(inputs.brand)
      ) {
        setInputs((prev) => ({ ...prev, brand: "" }));
      }
    }

    setSearchTerms((prev) => ({
      ...prev,
      [field]: "",
    }));

    setOpenDropdown(null); // close dropdown
  };

  const handleRemoveOption = (field, value) => {
    const nextCategories =
      field === "categories"
        ? selectedOptions.categories.filter((option) => option !== value)
        : selectedOptions.categories;

    setSelectedOptions((prev) => ({
      ...prev,
      [field]: prev[field].filter((option) => option !== value),
      ...(field === "categories"
        ? {
            type: prev.type.filter((type) =>
              getTypeOptionsForCategories(
                prev.categories.filter((option) => option !== value)
              ).includes(type)
            ),
            size: prev.categories
              .filter((option) => option !== value)
              .some(isHairExtensionCategory)
              ? []
              : prev.size,
          }
        : {}),
    }));

    if (field === "categories" && isHairExtensionCategory(value)) {
      setSizes([]);
    }

    if (
      field === "categories" &&
      inputs.brand &&
      !getBrandOptionsForCategories(nextCategories).includes(inputs.brand)
    ) {
      setInputs((prev) => ({ ...prev, brand: "" }));
    }
  };

  const handleBrandSelect = (brand) => {
    setInputs((prev) => ({
      ...prev,
      brand,
    }));

    setSearchTerms((prev) => ({
      ...prev,
      brand: "",
    }));

    setOpenDropdown(null);
  };

  const handleAddSize = () => {
    setSizes((prev) => [...prev, { label: "", price: "" }]);
  };

  const handleSizeChange = (index, field, value) => {
    setSizes((prev) =>
      prev.map((size, sizeIndex) =>
        sizeIndex === index ? { ...size, [field]: value } : size
      )
    );
  };

  const handleRemoveSize = (index) => {
    setSizes((prev) => prev.filter((_, sizeIndex) => sizeIndex !== index));
  };

  const getValidSizes = () =>
    sizes
      .map((size) => ({
        label: String(size.label || "").trim(),
        price: Number(size.price),
      }))
      .filter((size) => size.label && !Number.isNaN(size.price));

  const handleUpload = async (e) => {
    e.preventDefault();

    if (selectedImages.length === 0) {
      alert("Please select at least one image");
      return;
    }

    if (!inputs.title || !inputs.desc) {
      alert("Please fill Title and Description");
      return;
    }

    setUploading("Starting upload...");

    try {
      const uploadedUrls = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const data = new FormData();

        const webpFile = new File(
          [image.compressedBlob],
          `product_${Date.now()}_${i}.webp`,
          { type: "image/webp" }
        );

        data.append("file", webpFile);
        data.append("upload_preset", "uploads");

        setUploading(`Uploading image ${i + 1} of ${selectedImages.length}...`);

        const uploadRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dkjenslgr/image/upload",
          data
        );

        uploadedUrls.push(uploadRes.data.secure_url || uploadRes.data.url);
      }

      const productData = {
        title: inputs.title,
        desc: inputs.desc,
        img: uploadedUrls,
        video: inputs.video || "",
        categories: selectedOptions.categories,
        brand: inputs.brand || "",
        ...(!showProductSizes && {
          originalPrice: inputs.originalPrice
            ? Number(inputs.originalPrice)
            : undefined,
          discountedPrice: inputs.discountedPrice
            ? Number(inputs.discountedPrice)
            : undefined,
        }),
        items_per_box: inputs.items_per_box
          ? Number(inputs.items_per_box)
          : 1,
        stock: inputs.stock ? Number(inputs.stock) : 0,
        type: selectedOptions.type,
        size: showProductSizes ? [] : selectedOptions.size,
        sizes: showProductSizes ? getValidSizes() : [], // Hair extension length/price variants.
        ratings: [],
      };

      await userRequest.post("/products", productData);

      setUploading("Product created successfully!");

      setSelectedImages([]);
      setInputs({});
      setSizes([]);
      setSelectedOptions({
        categories: [],
        type: [],
        size: [],
      });
      setSearchTerms({
        brand: "",
        categories: "",
        type: "",
        size: "",
      });
    } catch (error) {
      console.error(error);
      setUploading("Upload failed. Please try again.");
    }
  };

  const renderClassificationField = (field) => (
    <div key={field} className="relative">
      <label className="block text-sm font-medium text-gray-600 mb-2 capitalize">
        {field}
        <span className="text-xs text-gray-500 ml-1">
          ({selectedOptions[field].length} selected)
        </span>
      </label>

      <button
        type="button"
        disabled={field === "type" && selectedOptions.categories.length === 0}
        onClick={() =>
          setOpenDropdown(openDropdown === field ? null : field)
        }
        className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        {field === "type" && selectedOptions.categories.length === 0
          ? "Select category first"
          : `Select ${field}`}
      </button>

      {openDropdown === field && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          <div className="relative border-b border-gray-100">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${field}`}
              value={searchTerms[field]}
              onChange={(e) => handleSearchChange(field, e.target.value)}
              className="w-full pl-10 pr-4 py-2 outline-none rounded-t-lg"
            />
          </div>

          {getFilteredOptions(field).map((option) => (
            <div
              key={option}
              onClick={() => handleSelectChange(field, option)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              {option}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {selectedOptions[field].map((option) => (
          <span
            key={option}
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            {option}
            <button
              type="button"
              onClick={() => handleRemoveOption(field, option)}
              className="text-blue-600 hover:text-blue-900"
            >
              <FaTrash className="text-xs" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
          >
            <FaArrowLeft />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-800">
            Create New Product
          </h1>

          <div className="w-20" />
        </div>

        <form
          onSubmit={handleUpload}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl border">
                <label className="block text-lg font-semibold text-gray-700 mb-4">
                  Product Images ({selectedImages.length}/4)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt="Product preview"
                        className="w-full h-24 object-cover rounded-lg shadow"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}

                  {selectedImages.length < 4 && (
                    <label
                      htmlFor="file"
                      className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400"
                    >
                      <FaPlus className="text-gray-400 text-xl mb-1" />
                      <span className="text-sm text-gray-500">Add Image</span>
                    </label>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  multiple
                  accept="image/*"
                  onChange={imageChange}
                  className="hidden"
                />

                <p className="text-sm text-blue-600 font-medium">
                  {uploading}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                  Basic Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={inputs.title || ""}
                    onChange={handleChange}
                    placeholder="Enter product title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="desc"
                    required
                    rows={6}
                    value={inputs.desc || ""}
                    onChange={handleChange}
                    placeholder="Enter product description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Video URL
                  </label>
                  <input
                    type="text"
                    name="video"
                    value={inputs.video || ""}
                    onChange={handleChange}
                    placeholder="Optional video URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                  Price & Box Details
                </h2>

                {!showProductSizes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Original Price
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={inputs.originalPrice || ""}
                      onChange={handleChange}
                      placeholder="Example: £5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Discounted Price
                    </label>
                    <input
                      type="number"
                      name="discountedPrice"
                      value={inputs.discountedPrice || ""}
                      onChange={handleChange}
                      placeholder="Example: £3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Hair extension prices are set by length below.
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Items Per Box
                  </label>
                  <input
                    type="number"
                    name="items_per_box"
                    min="1"
                    value={inputs.items_per_box || 1}
                    onChange={handleChange}
                    placeholder="Example: 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Available Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    value={inputs.stock || ""}
                    onChange={handleChange}
                    placeholder="Example: 50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                  Product Classification
                </h2>

                {renderClassificationField("categories")}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Brand
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown(openDropdown === "brand" ? null : "brand")
                      }
                      className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                    >
                      {inputs.brand || "Select brand"}
                    </button>

                    {openDropdown === "brand" && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                        <div className="relative border-b border-gray-100">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search brand"
                            value={searchTerms.brand}
                            onChange={(e) =>
                              handleSearchChange("brand", e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 outline-none rounded-t-lg"
                          />
                        </div>

                        {getFilteredOptions("brand").map((brand) => (
                          <div
                            key={brand}
                            onClick={() => handleBrandSelect(brand)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {brand}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {inputs.brand && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {inputs.brand}
                        <button
                          type="button"
                          onClick={() =>
                            setInputs((prev) => ({ ...prev, brand: "" }))
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </span>
                    </div>
                  )}

                </div>

                {classificationFields.map((field) => renderClassificationField(field))}

                {showProductSizes && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600">
                          Product Sizes
                        </h3>
                        <p className="text-xs text-gray-500">
                          Length-specific prices for hair extension products.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddSize}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
                      >
                        <FaPlus className="text-xs" />
                        Add Size
                      </button>
                    </div>

                    {sizes.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                        Add size rows instead of using the standard size dropdown.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {sizes.map((size, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_1fr_auto]"
                          >
                            <input
                              type="text"
                              value={size.label}
                              onChange={(e) =>
                                handleSizeChange(index, "label", e.target.value)
                              }
                              placeholder="Size / Length, e.g. 10"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={size.price}
                              onChange={(e) =>
                                handleSizeChange(index, "price", e.target.value)
                              }
                              placeholder="Price, e.g. 17.99"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveSize(index)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  uploading.includes("Uploading") ||
                  uploading.includes("Starting")
                }
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
              >
                {uploading.includes("Uploading") ||
                  uploading.includes("Starting")
                  ? "Creating Product..."
                  : "Create Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProduct;
