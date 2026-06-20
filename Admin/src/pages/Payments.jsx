import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFilter,
  FaMoneyBillWave,
  FaRedo,
  FaSearch,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { userRequest } from "../requestMethods";

const statusOptions = [
  "all",
  "success",
  "refunded",
  "pending",
  "failed",
  "cancelled",
  "incomplete",
];

const statusMap = {
  completed: {
    text: "Completed",
    color: "bg-green-100 text-green-800",
    icon: FaCheckCircle,
  },
  success: {
    text: "Success",
    color: "bg-green-100 text-green-800",
    icon: FaCheckCircle,
  },
  paid: {
    text: "Paid",
    color: "bg-green-100 text-green-800",
    icon: FaCheckCircle,
  },
  refunded: {
    text: "Refunded",
    color: "bg-blue-100 text-blue-800",
    icon: FaMoneyBillWave,
  },
  pending: {
    text: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: FaClock,
  },
  initiated: {
    text: "Initiated",
    color: "bg-blue-100 text-blue-800",
    icon: FaClock,
  },
  failed: {
    text: "Failed",
    color: "bg-red-100 text-red-800",
    icon: FaTimesCircle,
  },
  cancelled: {
    text: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: FaTimesCircle,
  },
  incomplete: {
    text: "Incomplete",
    color: "bg-orange-100 text-orange-800",
    icon: FaExclamationTriangle,
  },
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const formatCurrency = (amount) =>
    `£ ${Number(amount || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not available";

    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatus = (payment) => {
    if (
      payment.refundStatus === "succeeded" ||
      payment.payment_status === "refunded" ||
      payment.status_of_transaction === "refunded" ||
      payment.status === "refunded"
    ) {
      return "refunded";
    }

    return String(
      payment.payment_status ||
        payment.status ||
        payment.status_of_transaction ||
        "pending"
    ).toLowerCase();
  };

  const getTransactionStatus = (payment) =>
    String(payment.status_of_transaction || "").toLowerCase();

  const isSuccessfulPayment = (payment) => {
    const paymentStatus = getPaymentStatus(payment);
    const transactionStatus = getTransactionStatus(payment);

    return (
      paymentStatus === "success" ||
      paymentStatus === "completed" ||
      transactionStatus === "paid"
    );
  };

  const isRefundedPayment = (payment) => getPaymentStatus(payment) === "refunded";

  const isFailedPayment = (payment) => {
    const paymentStatus = getPaymentStatus(payment);

    return (
      paymentStatus === "failed" ||
      paymentStatus === "cancelled" ||
      paymentStatus === "incomplete"
    );
  };

  const isPendingPayment = (payment) =>
    !isSuccessfulPayment(payment) &&
    !isRefundedPayment(payment) &&
    !isFailedPayment(payment);

  const getStatusInfo = (payment) => {
    const status = getPaymentStatus(payment);
    return statusMap[status] || statusMap.pending;
  };

  const getCustomerName = (payment) =>
    payment.customer?.name ||
    [payment.first_name, payment.last_name].filter(Boolean).join(" ") ||
    payment.orderId?.name ||
    "Customer";

  const getCustomerEmail = (payment) =>
    payment.customer?.email || payment.email || payment.orderId?.email || "No email";

  const getCustomerPhone = (payment) =>
    payment.customer?.phone || payment.phone || payment.orderId?.phone || "No phone";

  const getTotalAmount = (payment) =>
    Number(payment.totalAmount ?? payment.orderId?.totalAmount ?? payment.amount ?? 0);

  const getSubtotal = (payment) =>
    Number(payment.amount ?? payment.orderId?.subtotal ?? payment.orderId?.amount ?? 0);

  const getShippingFee = (payment) =>
    Number(payment.shippingFee ?? payment.orderId?.shippingFee ?? 0);

  const getOrderId = (payment) => payment.orderId?._id || payment.orderId || "";

  const getFailureReason = (payment) =>
    payment.failureReason ||
    payment.failure_reason ||
    payment.rawStatusDetails?.last_payment_error?.message ||
    payment.rawStatusDetails?.failure_message ||
    "No failure reason recorded";

  const getStatusReason = (payment) => {
    if (isRefundedPayment(payment)) {
      return (
        payment.orderId?.cancellationReason ||
        payment.refundFailureReason ||
        "No cancellation reason recorded"
      );
    }

    return getFailureReason(payment);
  };

  const fetchPayments = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await userRequest.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdatePayment = async (id, nextStatus) => {
    try {
      const payload =
        nextStatus === "completed"
          ? {
              status: "completed",
              payment_status: "success",
              status_of_transaction: "paid",
            }
          : {
              status: "failed",
              payment_status: "failed",
              status_of_transaction: "unpaid",
              failureReason: "Marked failed by admin",
              failure_reason: "Marked failed by admin",
            };

      const res = await userRequest.put(`/payments/${id}`, payload);

      setPayments((prev) =>
        prev.map((payment) => (payment._id === id ? res.data : payment))
      );
    } catch (error) {
      alert(error.response?.data?.message || "Payment update failed");
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Delete this payment record?")) return;

    try {
      await userRequest.delete(`/payments/${id}`);
      setPayments((prev) => prev.filter((payment) => payment._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || "Payment delete failed");
    }
  };

  const methods = useMemo(() => {
    const uniqueMethods = new Set(
      payments
        .map((payment) => payment.mode_of_transaction || "Unknown")
        .filter(Boolean)
    );

    return ["all", ...Array.from(uniqueMethods)];
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = getPaymentStatus(payment);
      const method = payment.mode_of_transaction || "Unknown";
      const orderId = getOrderId(payment);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter ||
        (statusFilter === "success" && isSuccessfulPayment(payment)) ||
        (statusFilter === "pending" && isPendingPayment(payment)) ||
        (statusFilter === "failed" && isFailedPayment(payment));

      const matchesMethod =
        methodFilter === "all" || method.toLowerCase() === methodFilter.toLowerCase();

      const searchable = [
        payment._id,
        orderId,
        getCustomerName(payment),
        getCustomerEmail(payment),
        getCustomerPhone(payment),
        payment.transactionId,
        payment.transaction_id,
        payment.stripeSessionId,
        payment.stripe_session_id,
        getFailureReason(payment),
        getStatusReason(payment),
        method,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesMethod && (!term || searchable.includes(term));
    });
  }, [methodFilter, payments, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const successfulPayments = payments.filter(isSuccessfulPayment);
    const failedPayments = payments.filter(isFailedPayment);
    const pendingPayments = payments.filter(isPendingPayment);
    const codPending = payments.filter(
      (payment) =>
        String(payment.mode_of_transaction || "").toLowerCase() === "cod" &&
        isPendingPayment(payment)
    );

    return {
      totalPayments: payments.length,
      successfulCount: successfulPayments.length,
      pendingCount: pendingPayments.length,
      failedCount: failedPayments.length,
      totalRevenue: successfulPayments.reduce(
        (sum, payment) => sum + getTotalAmount(payment),
        0
      ),
      failedValue: failedPayments.reduce(
        (sum, payment) => sum + getTotalAmount(payment),
        0
      ),
      pendingValue: pendingPayments.reduce(
        (sum, payment) => sum + getTotalAmount(payment),
        0
      ),
      codPendingCount: codPending.length,
    };
  }, [payments]);

  const columns = [
    {
      field: "_id",
      headerName: "Payment",
      width: 130,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <div>
          <div className="font-mono text-sm font-semibold text-gray-700">
            #{params.row._id.slice(-8).toUpperCase()}
          </div>
          <div className="text-xs text-gray-400">
            {params.row.currency?.toUpperCase() || "GBP"}
          </div>
        </div>
      ),
    },
    {
      field: "order",
      headerName: "Order",
      width: 130,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => {
        const orderId = getOrderId(params.row);

        if (!orderId) {
          return <span className="text-sm text-gray-400">No order yet</span>;
        }

        return (
          <Link
            to={`/order/${orderId}`}
            className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            #{orderId.slice(-8).toUpperCase()}
          </Link>
        );
      },
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 240,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <div>
          <div className="font-semibold text-gray-900">
            {getCustomerName(params.row)}
          </div>
          <div className="text-xs text-gray-500">{getCustomerEmail(params.row)}</div>
          <div className="text-xs text-gray-400">{getCustomerPhone(params.row)}</div>
        </div>
      ),
    },
    {
      field: "totalAmount",
      headerName: "Total Amount",
      width: 150,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <div>
          <div
            className={`text-sm font-bold ${
              isSuccessfulPayment(params.row)
                ? "text-green-700"
                : isFailedPayment(params.row)
                  ? "text-red-700"
                  : "text-gray-900"
            }`}
          >
            {formatCurrency(getTotalAmount(params.row))}
          </div>
          <div className="text-xs text-gray-500">
            Subtotal {formatCurrency(getSubtotal(params.row))}
          </div>
          <div className="text-xs text-gray-500">
            Shipping {formatCurrency(getShippingFee(params.row))}
          </div>
        </div>
      ),
    },
    {
      field: "payment_status",
      headerName: "Status",
      width: 150,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => {
        const statusInfo = getStatusInfo(params.row);
        const StatusIcon = statusInfo.icon;

        return (
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
          >
            <StatusIcon size={12} />
            <span>{statusInfo.text}</span>
          </div>
        );
      },
    },
    {
      field: "statusReason",
      headerName: "Status Reason",
      width: 260,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => {
        if (isRefundedPayment(params.row)) {
          return (
            <span
              className="text-sm font-medium text-blue-700"
              title={getStatusReason(params.row)}
            >
              User cancelled the order: {getStatusReason(params.row)}
            </span>
          );
        }

        if (!isFailedPayment(params.row)) {
          return <span className="text-sm text-gray-400">Not applicable</span>;
        }

        return (
          <span className="text-sm text-red-700" title={getFailureReason(params.row)}>
            {getFailureReason(params.row)}
          </span>
        );
      },
    },
    {
      field: "method",
      headerName: "Method",
      width: 130,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          {params.row.mode_of_transaction || "Unknown"}
        </span>
      ),
    },
    {
      field: "transaction",
      headerName: "Transaction ID",
      width: 220,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <span className="font-mono text-xs text-gray-600">
          {params.row.transactionId ||
            params.row.transaction_id ||
            params.row.stripePaymentIntentId ||
            params.row.stripe_payment_intent_id ||
            params.row.stripeSessionId ||
            "Not available"}
        </span>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 170,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(params.row.createdAt || params.row.created_at)}
        </span>
      ),
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      width: 170,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(params.row.updatedAt || params.row.updated_at)}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 230,
      sortable: false,
      headerClassName: "font-bold text-gray-700",
      renderCell: (params) => {
        const successful = isSuccessfulPayment(params.row);
        const failed = isFailedPayment(params.row);
        const refunded = isRefundedPayment(params.row);

        return (
          <div className="flex items-center gap-2">
            {!successful && !refunded && (
              <button
                onClick={() => handleUpdatePayment(params.row._id, "completed")}
                className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                title="Mark payment as successful"
              >
                Complete
              </button>
            )}
            {!failed && !refunded && (
              <button
                onClick={() => handleUpdatePayment(params.row._id, "failed")}
                className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                title="Mark payment as failed"
              >
                Fail
              </button>
            )}
            {refunded ? (
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                Refund complete
              </span>
            ) : (
              <button
                onClick={() => handleDeletePayment(params.row._id)}
                className="rounded bg-gray-700 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                title="Delete payment record"
              >
                Delete
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      helper: `${stats.successfulCount} successful payments`,
      icon: FaMoneyBillWave,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Failed Value",
      value: formatCurrency(stats.failedValue),
      helper: `${stats.failedCount} failed payments`,
      icon: FaTimesCircle,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Pending Value",
      value: formatCurrency(stats.pendingValue),
      helper: `${stats.pendingCount} pending payments`,
      icon: FaClock,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Pending COD",
      value: stats.codPendingCount,
      helper: "Cash collection still open",
      icon: FaTruck,
      color: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="mt-2 text-gray-600">
              Track successful, pending, failed, Stripe, and COD payment records.
            </p>
          </div>

          <button
            onClick={() => fetchPayments({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <FaRedo className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
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
                  placeholder="Search by customer, order, payment, phone, method, transaction ID..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status === "all" ? "All statuses" : status}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none"
                >
                  {methods.map((method) => (
                    <option key={method} value={method}>
                      {method === "all" ? "All methods" : method}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setMethodFilter("all");
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
                rows={filteredPayments}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                getRowHeight={() => "auto"}
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f3f4f6",
                    py: 1.5,
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
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f8fafc",
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {Math.min(filteredPayments.length, paginationModel.pageSize)} of{" "}
            {filteredPayments.length} filtered payments
          </span>
          <span>
            All payments: {stats.totalPayments} | Successful: {stats.successfulCount} |
            Failed: {stats.failedCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Payments;
