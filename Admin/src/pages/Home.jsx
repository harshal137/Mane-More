import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaRedo,
  FaShoppingBag,
  FaTimesCircle,
  FaTruck,
  FaUsers,
} from "react-icons/fa";
import { userRequest } from "../requestMethods";

const EMPTY_DASHBOARD = {
  products: [],
  orders: [],
  users: [],
  payments: [],
};

const STATUS_STYLES = {
  success: "bg-green-50 text-green-700",
  completed: "bg-green-50 text-green-700",
  paid: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  initiated: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  incomplete: "bg-orange-50 text-orange-700",
};

const Home = () => {
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [productsRes, ordersRes, usersRes, paymentsRes] = await Promise.all([
        userRequest.get("/products"),
        userRequest.get("/orders"),
        userRequest.get("/users"),
        userRequest.get("/payments"),
      ]);

      setDashboardData({
        products: Array.isArray(productsRes.data) ? productsRes.data : [],
        orders: Array.isArray(ordersRes.data) ? ordersRes.data : [],
        users: Array.isArray(usersRes.data) ? usersRes.data : [],
        payments: Array.isArray(paymentsRes.data) ? paymentsRes.data : [],
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setDashboardData(EMPTY_DASHBOARD);
      setError(
        err.response?.data?.message ||
          "Dashboard data could not be loaded. Please refresh after confirming admin login."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const isPaymentSuccess = (payment) => {
    const values = [
      payment.payment_status,
      payment.status,
      payment.status_of_transaction,
    ].map((value) => String(value || "").toLowerCase());

    return values.includes("success") || values.includes("completed") || values.includes("paid");
  };

  const isPaymentFailed = (payment) => {
    const values = [payment.payment_status, payment.status].map((value) =>
      String(value || "").toLowerCase()
    );

    return values.includes("failed") || values.includes("cancelled") || values.includes("incomplete");
  };

  const getPaymentAmount = (payment) =>
    Number(payment.totalAmount ?? payment.amount ?? payment.orderId?.totalAmount ?? 0);

  const getOrderAmount = (order) =>
    Number(order.totalAmount ?? order.total ?? order.amount ?? 0);

  const formatCurrency = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN", {
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

  const getCustomerName = (payment) =>
    payment.customer?.name ||
    [payment.first_name, payment.last_name].filter(Boolean).join(" ") ||
    payment.orderId?.name ||
    "Customer";

  const getCustomerEmail = (payment) =>
    payment.customer?.email || payment.email || payment.orderId?.email || "No email";

  const getStatusLabel = (payment) =>
    payment.payment_status || payment.status || payment.status_of_transaction || "pending";

  const getStatusClass = (status) =>
    STATUS_STYLES[String(status || "").toLowerCase()] || "bg-gray-100 text-gray-700";

  const getFailureReason = (payment) =>
    payment.failureReason ||
    payment.failure_reason ||
    payment.rawStatusDetails?.last_payment_error?.message ||
    payment.rawStatusDetails?.failure_message ||
    "No failure reason recorded";

  const metrics = useMemo(() => {
    const { products, orders, users, payments } = dashboardData;

    const successfulPayments = payments.filter(isPaymentSuccess);
    const failedPayments = payments.filter(isPaymentFailed);
    const pendingPayments = payments.filter(
      (payment) => !isPaymentSuccess(payment) && !isPaymentFailed(payment)
    );

    const paidRevenue = successfulPayments.reduce(
      (sum, payment) => sum + getPaymentAmount(payment),
      0
    );

    const failedPaymentValue = failedPayments.reduce(
      (sum, payment) => sum + getPaymentAmount(payment),
      0
    );

    const activeOrders = orders.filter((order) => {
      const status = String(order.delivery_status || "Placed").toLowerCase();
      return status !== "delivered" && status !== "cancelled";
    });

    const deliveredOrders = orders.filter(
      (order) => String(order.delivery_status || "").toLowerCase() === "delivered"
    );

    const unpaidCodOrders = orders.filter(
      (order) =>
        String(order.mode_of_transaction || "").toLowerCase() === "cod" &&
        String(order.status_of_transaction || "").toLowerCase() !== "paid"
    );

    const registeredCustomers = users.filter(
      (user) => String(user.role || "user").toLowerCase() !== "admin"
    );

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      deliveredOrders: deliveredOrders.length,
      totalUsers: registeredCustomers.length,
      totalPayments: payments.length,
      successfulPayments: successfulPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      totalRevenue: paidRevenue,
      failedPaymentValue,
      unpaidCodOrders: unpaidCodOrders.length,
      averagePaidOrderValue:
        successfulPayments.length > 0 ? paidRevenue / successfulPayments.length : 0,
    };
  }, [dashboardData]);

  const latestTransactions = useMemo(() => {
    return [...dashboardData.payments]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.created_at || 0) -
          new Date(a.createdAt || a.created_at || 0)
      )
      .slice(0, 8);
  }, [dashboardData.payments]);

  const chartData = useMemo(() => {
    const labels = [];
    const revenue = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const key = date.toISOString().slice(0, 10);

      const dayRevenue = dashboardData.payments
        .filter((payment) => {
          if (!isPaymentSuccess(payment)) return false;

          const createdAt = payment.createdAt || payment.created_at;
          if (!createdAt) return false;

          return new Date(createdAt).toISOString().slice(0, 10) === key;
        })
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

      labels.push(
        date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })
      );
      revenue.push(dayRevenue);
    }

    return { labels, revenue };
  }, [dashboardData.payments]);

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      helper: `${metrics.successfulPayments} successful payments`,
      icon: FaMoneyBillWave,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Failed Payment Value",
      value: formatCurrency(metrics.failedPaymentValue),
      helper: `${metrics.failedPayments} failed payments`,
      icon: FaTimesCircle,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Active Orders",
      value: metrics.activeOrders,
      helper: `${metrics.deliveredOrders} delivered of ${metrics.totalOrders}`,
      icon: FaTruck,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Pending COD",
      value: metrics.unpaidCodOrders,
      helper: "COD orders awaiting collection",
      icon: FaClock,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Products",
      value: metrics.totalProducts,
      helper: "Active catalog items",
      icon: FaBoxOpen,
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Customers",
      value: metrics.totalUsers,
      helper: "Registered non-admin users",
      icon: FaUsers,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Total Payments",
      value: metrics.totalPayments,
      helper: `${metrics.pendingPayments} pending`,
      icon: FaCreditCard,
      color: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Avg Paid Order",
      value: formatCurrency(metrics.averagePaidOrderValue),
      helper: "Average paid payment value",
      icon: FaShoppingBag,
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="mt-2 text-gray-600">
              Live store summary from orders, payments, users, and products.
            </p>
          </div>

          <button
            onClick={() => fetchDashboardData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
          >
            <FaRedo className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-2 text-sm text-gray-500">{card.helper}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}>
                    <Icon />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Latest Transactions</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Most recent payment attempts across Stripe and COD.
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = "/payments";
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-semibold text-gray-600">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestTransactions.length > 0 ? (
                    latestTransactions.map((payment) => {
                      const status = getStatusLabel(payment);
                      const failed = isPaymentFailed(payment);
                      const customerName = getCustomerName(payment);

                      return (
                        <tr key={payment._id} className="text-sm hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">{customerName}</div>
                            <div className="text-xs text-gray-500">{getCustomerEmail(payment)}</div>
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {payment.mode_of_transaction || "Not available"}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {formatDateTime(payment.createdAt || payment.created_at)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {formatCurrency(getPaymentAmount(payment))}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="max-w-56 px-4 py-4 text-xs text-gray-600">
                            {failed ? getFailureReason(payment) : "Not applicable"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                        No payment transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
              <p className="mt-1 text-sm text-gray-500">Successful payments over the last 7 days.</p>

              {chartData.revenue.some((value) => value > 0) ? (
                <LineChart
                  xAxis={[
                    {
                      data: chartData.labels,
                      scaleType: "point",
                    },
                  ]}
                  series={[
                    {
                      data: chartData.revenue,
                      label: "Revenue",
                      color: "#2563EB",
                      area: true,
                      showMark: true,
                    },
                  ]}
                  height={280}
                  margin={{ left: 58, right: 16, top: 20, bottom: 42 }}
                  grid={{ horizontal: true }}
                />
              ) : (
                <div className="mt-6 flex h-64 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
                  No paid revenue in the last 7 days.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Operational Health</h2>
              <div className="mt-5 space-y-4">
                <HealthRow
                  icon={<FaCheckCircle />}
                  label="Successful payments"
                  value={metrics.successfulPayments}
                  color="text-green-600"
                />
                <HealthRow
                  icon={<FaClock />}
                  label="Pending payments"
                  value={metrics.pendingPayments}
                  color="text-yellow-600"
                />
                <HealthRow
                  icon={<FaTimesCircle />}
                  label="Failed payments"
                  value={metrics.failedPayments}
                  color="text-red-600"
                />
                <HealthRow
                  icon={<FaTruck />}
                  label="Active fulfillment"
                  value={metrics.activeOrders}
                  color="text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthRow = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
    <div className={`flex items-center gap-3 ${color}`}>
      {icon}
      <span className="font-medium text-gray-700">{label}</span>
    </div>
    <span className="font-bold text-gray-900">{value}</span>
  </div>
);

export default Home;
