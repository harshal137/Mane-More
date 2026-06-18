import { DataGrid } from "@mui/x-data-grid";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCheckDouble,
  FaClock,
  FaCreditCard,
  FaMoneyBillWave,
  FaRedo,
  FaSearch,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import { userRequest } from "../requestMethods";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const fetchOrders = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const res = await userRequest.get("/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Fetch orders error:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (amount) =>
    `£ ${Number(amount || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderAmount = (order) =>
    Number(order.totalAmount ?? order.total ?? order.amount ?? 0);

  const getDeliveryStatus = (order) => String(order.delivery_status || "Placed");

  const requiresRefund = (order) =>
    getDeliveryStatus(order).toLowerCase() === "cancelled" &&
    String(order.mode_of_transaction || "").toLowerCase() !== "cod" &&
    (String(order.status_of_transaction || "").toLowerCase() === "paid" ||
      String(order.payment_status || "").toLowerCase() === "success") &&
    !["processing", "succeeded"].includes(order.refundStatus);

  const getStatusInfo = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "placed":
        return { text: "Ordered", color: "bg-yellow-100 text-yellow-800", icon: FaClock };
      case "processing":
        return { text: "Processing", color: "bg-blue-100 text-blue-800", icon: FaTruck };
      case "shipped":
        return { text: "Shipped", color: "bg-purple-100 text-purple-800", icon: FaBoxOpen };
      case "delivered":
        return { text: "Delivered", color: "bg-green-100 text-green-800", icon: FaCheckDouble };
      case "cancelled":
        return { text: "Cancelled", color: "bg-red-100 text-red-800", icon: FaClock };
      default:
        return { text: "Ordered", color: "bg-yellow-100 text-yellow-800", icon: FaClock };
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const delivery = getDeliveryStatus(order).toLowerCase();
      const payment = String(order.status_of_transaction || "unpaid").toLowerCase();
      const searchable = [
        order._id,
        order.name,
        order.email,
        order.phone,
        order.mode_of_transaction,
        order.transactionId,
        order.transaction_id,
        order.deliveryMarkedBy?.name,
        delivery,
        payment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (statusFilter === "all" || delivery === statusFilter) &&
        (paymentFilter === "all" || payment === paymentFilter) &&
        (!term || searchable.includes(term))
      );
    });
  }, [orders, paymentFilter, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const delivered = orders.filter(
      (order) => getDeliveryStatus(order).toLowerCase() === "delivered"
    );
    const active = orders.filter((order) => {
      const delivery = getDeliveryStatus(order).toLowerCase();
      return delivery !== "delivered" && delivery !== "cancelled";
    });
    const paid = orders.filter(
      (order) => String(order.status_of_transaction || "").toLowerCase() === "paid"
    );
    const cancelled = orders.filter(
      (order) => getDeliveryStatus(order).toLowerCase() === "cancelled"
    );
    const unpaidCod = orders.filter(
      (order) =>
        String(order.mode_of_transaction || "").toLowerCase() === "cod" &&
        getDeliveryStatus(order).toLowerCase() !== "cancelled" &&
        String(order.status_of_transaction || "").toLowerCase() !== "paid"
    );

    return {
      total: orders.length,
      active: active.length,
      delivered: delivered.length,
      paid: paid.length,
      cancelled: cancelled.length,
      unpaidCod: unpaidCod.length,
    };
  }, [orders]);

  const columns = [
    {
      field: "_id",
      headerName: "Order",
      width: 130,
      renderCell: (params) => (
        <span className="font-mono text-sm font-semibold text-gray-700">
          #{params.row._id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 240,
      renderCell: (params) => (
        <div>
          <div className="font-semibold text-gray-900">{params.row.name || "Customer"}</div>
          <div className="text-xs text-gray-500">{params.row.email || "No email"}</div>
          <div className="text-xs text-gray-400">{params.row.phone || "No phone"}</div>
        </div>
      ),
    },
    {
      field: "total",
      headerName: "Total",
      width: 130,
      renderCell: (params) => (
        <span className="font-bold text-gray-900">
          {formatCurrency(getOrderAmount(params.row))}
        </span>
      ),
    },
    {
      field: "delivery_status",
      headerName: "Delivery",
      width: 150,
      renderCell: (params) => {
        const info = getStatusInfo(params.row.delivery_status);
        const Icon = info.icon;

        return (
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${info.color}`}>
            <Icon size={12} />
            {info.text}
          </span>
        );
      },
    },
    {
      field: "deliveryMarkedBy",
      headerName: "Marked By",
      width: 170,
      sortable: false,
      valueGetter: (_value, row) => row.deliveryMarkedBy?.name || "",
      renderCell: (params) => (
        <div>
          <div className="text-sm font-semibold text-gray-800">
            {params.row.deliveryMarkedBy?.name || "Not marked"}
          </div>
          {params.row.deliveryMarkedBy?.markedAt && (
            <div className="text-xs text-gray-400">
              {formatDate(params.row.deliveryMarkedBy.markedAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      field: "status_of_transaction",
      headerName: "Payment",
      width: 130,
      renderCell: (params) => {
        const paymentStatus = String(
          params.row.status_of_transaction || "unpaid"
        ).toLowerCase();
        const isPaid = paymentStatus === "paid";
        const isRefunded =
          paymentStatus === "refunded" ||
          params.row.refundStatus === "succeeded";

        const label = isRefunded ? "Refunded" : isPaid ? "Paid" : "Unpaid";
        const color = isRefunded
          ? "bg-blue-100 text-blue-800"
          : isPaid
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";

        return (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
            {label}
          </span>
        );
      },
    },
    {
      field: "mode_of_transaction",
      headerName: "Method",
      width: 120,
      renderCell: (params) => (
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          {params.row.mode_of_transaction || "-"}
        </span>
      ),
    },
    {
      field: "refundStatus",
      headerName: "Refund",
      width: 150,
      renderCell: (params) => {
        if (requiresRefund(params.row)) {
          return (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              Refund required
            </span>
          );
        }

        if (params.row.refundStatus === "processing") {
          return (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              Processing
            </span>
          );
        }

        if (params.row.refundStatus === "succeeded") {
          return (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Refunded
            </span>
          );
        }

        return <span className="text-sm text-gray-400">Not required</span>;
      },
    },
    {
      field: "createdAt",
      headerName: "Placed At",
      width: 180,
      renderCell: (params) => (
        <span className="text-sm text-gray-600">{formatDate(params.row.createdAt)}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Link
          to={`/order/${params.row._id}`}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
            requiresRefund(params.row)
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {requiresRefund(params.row) ? "Refund" : "Details"}
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="mt-2 text-gray-600">
              Track fulfillment, payment status, and order value from one place.
            </p>
          </div>
          <button
            onClick={() => fetchOrders({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <FaRedo className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Orders" value={metrics.total} icon={<FaBoxOpen />} color="bg-blue-100 text-blue-700" />
          <StatCard label="Active" value={metrics.active} icon={<FaTruck />} color="bg-yellow-100 text-yellow-700" />
          <StatCard label="Delivered" value={metrics.delivered} icon={<FaCheckDouble />} color="bg-green-100 text-green-700" />
          <StatCard label="Paid Orders" value={metrics.paid} icon={<FaMoneyBillWave />} color="bg-emerald-100 text-emerald-700" />
          <StatCard label="Cancelled" value={metrics.cancelled} icon={<FaTimesCircle />} color="bg-red-100 text-red-700" />
          <StatCard label="Unpaid COD" value={metrics.unpaidCod} icon={<FaCreditCard />} color="bg-red-100 text-red-700" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-xl flex-1">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer, order ID, phone, method, status..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none"
                >
                  <option value="all">All delivery</option>
                  <option value="placed">Ordered</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none"
                >
                  <option value="all">All payment</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Clear
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
                rows={filteredOrders}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                rowHeight={68}
                sx={gridSx}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

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

export default Orders;
