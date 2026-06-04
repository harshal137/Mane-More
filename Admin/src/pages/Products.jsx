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
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const fetchProducts = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const res = await userRequest.get("/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Fetch products error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatCurrency = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN", {
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
      console.log("Product delete error:", error);
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

          <Link
            to="/newproduct"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800"
          >
            <FaPlus size={14} />
            Add Product
          </Link>
        </div>

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
            Showing {Math.min(filteredProducts.length, paginationModel.pageSize)} of{" "}
            {filteredProducts.length} filtered products
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

export default Products;
