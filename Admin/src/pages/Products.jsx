import { DataGrid } from "@mui/x-data-grid";
import {
  FaBox,
  FaEdit,
  FaExclamationTriangle,
  FaFilter,
  FaPlus,
  FaRedo,
  FaSearch,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { userRequest } from "../requestMethods";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [catalogOptions, setCatalogOptions] = useState({
    categories: [],
    brands: [],
    brandsByCategory: {},
    sizes: [],
    typesByCategory: {},
  });
  const [optionForm, setOptionForm] = useState({
    category: "",
    brandCategory: "",
    brand: "",
    size: "",
    typeCategory: "",
    type: "",
  });
  const [optionsSaving, setOptionsSaving] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const fetchProducts = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const res = await userRequest.get("/products", {
        params: { limit: 500 },
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  useEffect(() => {
    fetchProducts();
    fetchCatalogOptions();
  }, []);

  const updateOptionForm = (field, value) => {
    setOptionForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveCatalogOptions = async (nextOptions) => {
    try {
      setOptionsSaving(true);
      const res = await userRequest.put("/catalog-options", nextOptions);
      setCatalogOptions({
        categories: res.data.categories || [],
        brands: res.data.brands || [],
        brandsByCategory: res.data.brandsByCategory || {},
        sizes: res.data.sizes || [],
        typesByCategory: res.data.typesByCategory || {},
      });
    } catch (error) {
      alert(error.response?.data?.message || "Catalog option update failed");
    } finally {
      setOptionsSaving(false);
    }
  };

  const addUniqueOption = (field, value) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;

    if (field === "categories" && catalogOptions.categories.length >= 5) {
      alert("No more than 5 categories are allowed");
      return;
    }

    const nextValues = [...new Set([...catalogOptions[field], cleanValue])];
    saveCatalogOptions({ ...catalogOptions, [field]: nextValues });
  };

  const addTypeOption = () => {
    const category = optionForm.typeCategory;
    const type = optionForm.type.trim();
    if (!category || !type) return;

    const nextTypes = [
      ...new Set([...(catalogOptions.typesByCategory[category] || []), type]),
    ];

    saveCatalogOptions({
      ...catalogOptions,
      typesByCategory: {
        ...catalogOptions.typesByCategory,
        [category]: nextTypes,
      },
    });
  };

  const addBrandOption = () => {
    const category = optionForm.brandCategory;
    const brand = optionForm.brand.trim();
    if (!category || !brand) return;

    const nextBrands = [...new Set([...catalogOptions.brands, brand])];
    const nextCategoryBrands = [
      ...new Set([...(catalogOptions.brandsByCategory[category] || []), brand]),
    ];

    saveCatalogOptions({
      ...catalogOptions,
      brands: nextBrands,
      brandsByCategory: {
        ...catalogOptions.brandsByCategory,
        [category]: nextCategoryBrands,
      },
    });
  };

  const removeOption = (field, value) => {
    const nextOptions = {
      ...catalogOptions,
      [field]: catalogOptions[field].filter((item) => item !== value),
    };

    if (field === "categories") {
      const nextTypesByCategory = { ...catalogOptions.typesByCategory };
      const nextBrandsByCategory = { ...catalogOptions.brandsByCategory };
      delete nextTypesByCategory[value];
      delete nextBrandsByCategory[value];
      nextOptions.typesByCategory = nextTypesByCategory;
      nextOptions.brandsByCategory = nextBrandsByCategory;
    }

    saveCatalogOptions(nextOptions);
  };

  const removeTypeOption = (category, type) => {
    saveCatalogOptions({
      ...catalogOptions,
      typesByCategory: {
        ...catalogOptions.typesByCategory,
        [category]: (catalogOptions.typesByCategory[category] || []).filter(
          (item) => item !== type
        ),
      },
    });
  };

  const removeBrandOption = (category, brand) => {
    const nextBrandsByCategory = {
      ...catalogOptions.brandsByCategory,
      [category]: (catalogOptions.brandsByCategory[category] || []).filter(
        (item) => item !== brand
      ),
    };

    const stillUsed = Object.values(nextBrandsByCategory).some((brands) =>
      brands.includes(brand)
    );

    saveCatalogOptions({
      ...catalogOptions,
      brands: stillUsed
        ? catalogOptions.brands
        : catalogOptions.brands.filter((item) => item !== brand),
      brandsByCategory: nextBrandsByCategory,
    });
  };

  const formatCurrency = (amount) =>
    `£ ${Number(amount || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;

  const listText = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "-";
    return value || "-";
  };

  const getPrice = (product) =>
    Number(product.discountedPrice || product.price || product.originalPrice || 0);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await userRequest.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || "Product delete failed");
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const stock = Number(product.stock || 0);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && stock > 0) ||
        (stockFilter === "low" && stock > 0 && stock <= 5) ||
        (stockFilter === "out" && stock <= 0);

      const searchable = [
        product._id,
        product.title,
        product.desc,
        product.brand,
        listText(product.categories),
        listText(product.type),
        listText(product.size),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStock && (!term || searchable.includes(term));
    });
  }, [products, searchTerm, stockFilter]);

  const visibleProductCount = Math.min(
    Math.max(filteredProducts.length - paginationModel.page * paginationModel.pageSize, 0),
    paginationModel.pageSize
  );

  const metrics = useMemo(() => {
    const inStock = products.filter((product) => Number(product.stock || 0) > 0);
    const lowStock = products.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 5;
    });
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + getPrice(product) * Number(product.stock || 0),
      0
    );

    return {
      total: products.length,
      inStock: inStock.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      stockUnits: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      inventoryValue,
    };
  }, [products]);

  const columns = [
    {
      field: "_id",
      headerName: "Product ID",
      width: 140,
      renderCell: (params) => (
        <span className="font-mono text-sm text-gray-600">
          #{params.row._id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      field: "product",
      headerName: "Product",
      width: 320,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <img
            className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
            src={Array.isArray(params.row.img) ? params.row.img[0] : params.row.img}
            alt={params.row.title}
          />
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900">{params.row.title}</div>
            <div className="truncate text-xs text-gray-500">{params.row.brand || "No brand"}</div>
          </div>
        </div>
      ),
    },
    {
      field: "categories",
      headerName: "Categories",
      width: 220,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{listText(params.row.categories)}</span>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 220,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{listText(params.row.type)}</span>
      ),
    },
    {
      field: "size",
      headerName: "Sizes",
      width: 180,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{listText(params.row.size)}</span>
      ),
    },
    {
      field: "originalPrice",
      headerName: "Original",
      width: 130,
      renderCell: (params) => (
        <span className="font-semibold text-gray-700">
          {formatCurrency(params.row.originalPrice)}
        </span>
      ),
    },
    {
      field: "discountedPrice",
      headerName: "Selling Price",
      width: 150,
      renderCell: (params) => (
        <span className="font-bold text-gray-900">
          {formatCurrency(getPrice(params.row))}
        </span>
      ),
    },
    {
      field: "stock",
      headerName: "Stock",
      width: 150,
      renderCell: (params) => {
        const stock = Number(params.row.stock || 0);
        const color =
          stock <= 0
            ? "bg-red-100 text-red-800"
            : stock <= 5
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800";

        return (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
            {stock <= 0 ? "Out of stock" : `${stock} units`}
          </span>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 140,
      renderCell: (params) => (
        <span className="text-sm text-gray-600">
          {params.row.createdAt
            ? new Date(params.row.createdAt).toLocaleDateString("en-IN")
            : "-"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/product/${params.row._id}`}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <FaEdit size={12} />
            Edit
          </Link>
          <button
            onClick={() => handleDelete(params.row._id)}
            className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            <FaTrash size={12} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  const statCards = [
    {
      label: "Total Products",
      value: metrics.total,
      helper: `${metrics.inStock} products currently in stock`,
      icon: FaBox,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Inventory Value",
      value: formatCurrency(metrics.inventoryValue),
      helper: `${metrics.stockUnits} total stock units`,
      icon: FaBox,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Low Stock",
      value: metrics.lowStock,
      helper: "Products with 1 to 5 units",
      icon: FaExclamationTriangle,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Out of Stock",
      value: metrics.outOfStock,
      helper: "Products unavailable to sell",
      icon: FaExclamationTriangle,
      color: "bg-red-100 text-red-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="mt-2 text-gray-600">
              Maintain catalog listings, stock levels, pricing, and product media.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowOptionsModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50"
            >
              <FaPlus size={14} />
              Catalog Options
            </button>

            <Link
              to="/newproduct"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800"
            >
              <FaPlus size={14} />
              Add Product
            </Link>
          </div>
        </div>

        {showOptionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Catalog Options</h2>
                  <p className="text-sm text-gray-500">
                    Manage brands, categories, category types, and size options.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <OptionManager
                  title="Categories"
                  helper={`${catalogOptions.categories.length}/5 categories used`}
                  value={optionForm.category}
                  disabled={catalogOptions.categories.length >= 5 || optionsSaving}
                  placeholder="Add category"
                  options={catalogOptions.categories}
                  onChange={(value) => updateOptionForm("category", value)}
                  onAdd={() => {
                    addUniqueOption("categories", optionForm.category);
                    updateOptionForm("category", "");
                  }}
                  onRemove={(value) => removeOption("categories", value)}
                />

                <OptionManager
                  title="Sizes"
                  value={optionForm.size}
                  disabled={optionsSaving}
                  placeholder="Add size"
                  options={catalogOptions.sizes}
                  onChange={(value) => updateOptionForm("size", value)}
                  onAdd={() => {
                    addUniqueOption("sizes", optionForm.size);
                    updateOptionForm("size", "");
                  }}
                  onRemove={(value) => removeOption("sizes", value)}
                />

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-1 font-semibold text-gray-900">Brands</h3>
                  <p className="mb-3 text-sm text-gray-500">
                    Add brands under the category they belong to.
                  </p>

                  <div className="grid gap-2">
                    <select
                      value={optionForm.brandCategory}
                      onChange={(e) => updateOptionForm("brandCategory", e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="">Category</option>
                      {catalogOptions.categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <input
                      value={optionForm.brand}
                      onChange={(e) => updateOptionForm("brand", e.target.value)}
                      placeholder="Add brand"
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    />

                    <button
                      type="button"
                      disabled={optionsSaving || !optionForm.brandCategory}
                      onClick={() => {
                        addBrandOption();
                        updateOptionForm("brand", "");
                      }}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Add Brand
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {catalogOptions.categories.map((category) => (
                      <div key={category}>
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(catalogOptions.brandsByCategory[category] || []).map((brand) => (
                            <OptionPill
                              key={brand}
                              label={brand}
                              onRemove={() => removeBrandOption(category, brand)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-1 font-semibold text-gray-900">Types</h3>
                  <p className="mb-3 text-sm text-gray-500">
                    Add types under the category they belong to.
                  </p>

                  <div className="grid gap-2">
                    <select
                      value={optionForm.typeCategory}
                      onChange={(e) => updateOptionForm("typeCategory", e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="">Category</option>
                      {catalogOptions.categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <input
                      value={optionForm.type}
                      onChange={(e) => updateOptionForm("type", e.target.value)}
                      placeholder="Add type"
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    />

                    <button
                      type="button"
                      disabled={optionsSaving || !optionForm.typeCategory}
                      onClick={() => {
                        addTypeOption();
                        updateOptionForm("type", "");
                      }}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Add Type
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {catalogOptions.categories.map((category) => (
                      <div key={category}>
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(catalogOptions.typesByCategory[category] || []).map((type) => (
                            <OptionPill
                              key={type}
                              label={type}
                              onRemove={() => removeTypeOption(category, type)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-2 text-sm text-gray-500">{card.helper}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                    <Icon className="text-xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-xl flex-1">
                <FaSearch className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search title, category, type, size, brand, or ID..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none"
                  >
                    <option value="all">All stock</option>
                    <option value="in">In stock</option>
                    <option value="low">Low stock</option>
                    <option value="out">Out of stock</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStockFilter("all");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>

                <button
                  onClick={() => fetchProducts({ silent: true })}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  <FaRedo className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={filteredProducts}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                rowHeight={72}
                sx={gridSx}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleProductCount} of {filteredProducts.length} filtered products
          </span>
          <span>
            All products: {metrics.total} | In stock: {metrics.inStock} | Out of stock:{" "}
            {metrics.outOfStock}
          </span>
        </div>
      </div>
    </div>
  );
};

const gridSx = {
  border: "none",
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid #f3f4f6",
    alignItems: "center",
  },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#f9fafb",
    borderBottom: "2px solid #e5e7eb",
  },
  "& .MuiDataGrid-footerContainer": {
    backgroundColor: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
  },
};

const OptionManager = ({
  title,
  helper,
  value,
  disabled,
  placeholder,
  options,
  onChange,
  onAdd,
  onRemove,
}) => (
  <div className="rounded-xl border border-gray-200 p-4">
    <h3 className="font-semibold text-gray-900">{title}</h3>
    {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}

    <div className="mt-3 grid gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 rounded-lg border border-gray-300 px-3 py-2"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Add
      </button>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((option) => (
        <OptionPill key={option} label={option} onRemove={() => onRemove(option)} />
      ))}
    </div>
  </div>
);

const OptionPill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="text-blue-600 hover:text-blue-950"
    >
      <FaTimes className="text-xs" />
    </button>
  </span>
);

export default Products;
