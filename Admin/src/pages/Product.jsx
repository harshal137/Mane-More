import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { userRequest } from "../requestMethods";

const Product = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split("/")[2];

  const fileInputRef = useRef(null);

  const [product, setProduct] = useState({});
  const [inputs, setInputs] = useState({});
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [uploading, setUploading] = useState("Ready");

  useEffect(() => {
    const getProduct = async () => {
      try {
        const res = await userRequest.get("/products/find/" + id);

        setProduct(res.data);
        setInputs({
          title: res.data.title || "",
          desc: res.data.desc || "",
          video: res.data.video || "",
          brand: res.data.brand || "",
          originalPrice: res.data.originalPrice || "",
          discountedPrice: res.data.discountedPrice || "",
          items_per_box: res.data.items_per_box || 1,
          stock: res.data.stock || 0,
          categories: res.data.categories?.join(", ") || "",
          type: res.data.type?.join(", ") || "",
          size: res.data.size?.join(", ") || "",
        });

        setExistingImages(Array.isArray(res.data.img) ? res.data.img : [res.data.img]);
      } catch (error) {
        console.log(error);
      }
    };

    getProduct();
  }, [id]);

  const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const imageChange = (e) => {
    const files = Array.from(e.target.files);

    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...previews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToCloudinary = async () => {
    const uploadedUrls = [];

    for (let i = 0; i < newImages.length; i++) {
      const data = new FormData();

      data.append("file", newImages[i].file);
      data.append("upload_preset", "uploads");

      setUploading(`Uploading image ${i + 1} of ${newImages.length}`);

      const uploadRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dkjenslgr/image/upload",
        data
      );

      uploadedUrls.push(uploadRes.data.secure_url || uploadRes.data.url);
    }

    return uploadedUrls;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setUploading("Updating product...");

      const uploadedUrls = await uploadImagesToCloudinary();

      const updatedProduct = {
        title: inputs.title,
        desc: inputs.desc,
        video: inputs.video,
        brand: inputs.brand,
        originalPrice: Number(inputs.originalPrice),
        discountedPrice: Number(inputs.discountedPrice),
        items_per_box: Number(inputs.items_per_box),
        stock: Number(inputs.stock),
        categories: inputs.categories
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        type: inputs.type
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        size: inputs.size
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        img: [...existingImages, ...uploadedUrls],
      };

      await userRequest.put(`/products/${id}`, updatedProduct);

      setUploading("Product updated successfully");
      navigate("/products");
    } catch (error) {
      console.log(error);
      setUploading("Update failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            <FaArrowLeft />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Update Product</h1>

          <div className="w-20" />
        </div>

        <form
          onSubmit={handleUpdate}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Product Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="title"
                    value={inputs.title || ""}
                    onChange={handleChange}
                    placeholder="Product title"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    name="brand"
                    value={inputs.brand || ""}
                    onChange={handleChange}
                    placeholder="Brand"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    type="number"
                    name="originalPrice"
                    value={inputs.originalPrice || ""}
                    onChange={handleChange}
                    placeholder="Original price"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    type="number"
                    name="discountedPrice"
                    value={inputs.discountedPrice || ""}
                    onChange={handleChange}
                    placeholder="Discounted price"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    type="number"
                    name="items_per_box"
                    value={inputs.items_per_box || ""}
                    onChange={handleChange}
                    placeholder="Items per box"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    type="number"
                    name="stock"
                    value={inputs.stock || ""}
                    onChange={handleChange}
                    placeholder="Available stock"
                    className="p-3 border rounded-lg"
                  />
                </div>

                <textarea
                  name="desc"
                  value={inputs.desc || ""}
                  onChange={handleChange}
                  placeholder="Product description"
                  rows={5}
                  className="w-full mt-4 p-3 border rounded-lg"
                />

                <input
                  name="video"
                  value={inputs.video || ""}
                  onChange={handleChange}
                  placeholder="Video URL"
                  className="w-full mt-4 p-3 border rounded-lg"
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Category, Type & Size
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    name="categories"
                    value={inputs.categories || ""}
                    onChange={handleChange}
                    placeholder="Hair Care, Skin Care"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    name="type"
                    value={inputs.type || ""}
                    onChange={handleChange}
                    placeholder="Shampoo, Wax"
                    className="p-3 border rounded-lg"
                  />

                  <input
                    name="size"
                    value={inputs.size || ""}
                    onChange={handleChange}
                    placeholder="100ML, 200ML"
                    className="p-3 border rounded-lg"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Add multiple values separated by comma.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800">
                Product Images
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt="Product"
                      className="h-32 w-full object-cover rounded-lg border"
                    />

                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}

                {newImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt="New"
                      className="h-32 w-full object-cover rounded-lg border"
                    />

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}

                <label
                  htmlFor="images"
                  className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500"
                >
                  <FaPlus className="text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500">Add Images</span>
                </label>

                <input
                  ref={fileInputRef}
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={imageChange}
                  className="hidden"
                />
              </div>

              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  Number(inputs.stock) > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {Number(inputs.stock) > 0
                  ? `In Stock: ${inputs.stock}`
                  : "Out of Stock"}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Update Product
              </button>

              <p className="text-sm text-gray-500">{uploading}</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Product;