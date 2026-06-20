import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import {
  FaChartBar,
  FaClock,
  FaDesktop,
  FaEye,
  FaGlobe,
  FaMobile,
  FaMousePointer,
  FaRedo,
  FaSearch,
  FaShoppingCart,
  FaTablet,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { userRequest } from "../requestMethods";

const actionLabels = {
  page_view: "Page View",
  button_click: "Button Click",
  login: "Login",
  purchase: "Purchase",
  add_to_cart: "Add To Cart",
  search: "Search",
  product_view: "Product View",
  bundle_view: "Bundle View",
};

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(7);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  const fetchAnalyticsData = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);

      const page = paginationModel.page + 1;
      const params = new URLSearchParams({
        limit: String(paginationModel.pageSize),
        page: String(page),
      });

      if (actionFilter !== "all") {
        params.set("actionType", actionFilter);
      }

      const [summaryRes, activityRes] = await Promise.all([
        userRequest.get(`/analytics/summary?days=${timeRange}`),
        userRequest.get(`/analytics?${params.toString()}`),
      ]);

      setSummary(summaryRes.data?.data || null);
      setActivity(Array.isArray(activityRes.data?.data) ? activityRes.data.data : []);
      setRowCount(activityRes.data?.pagination?.totalRecords || 0);
    } catch (error) {
      setSummary(null);
      setActivity([]);
      setRowCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, actionFilter, paginationModel.page, paginationModel.pageSize]);

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

  const formatActionType = (actionType) =>
    actionLabels[actionType] || actionType || "Activity";

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case "desktop":
        return <FaDesktop />;
      case "mobile":
        return <FaMobile />;
      case "tablet":
        return <FaTablet />;
      default:
        return <FaGlobe />;
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "page_view":
        return <FaEye />;
      case "button_click":
        return <FaMousePointer />;
      case "add_to_cart":
        return <FaShoppingCart />;
      case "login":
        return <FaUser />;
      default:
        return <FaChartBar />;
    }
  };

  const rows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return activity
      .filter((item) => {
        const searchable = [
          item.userName,
          item.userEmail,
          item.actionType,
          item.action,
          item.pageUrl,
          item.deviceType,
          item.browser,
          item.country,
          item.city,
          item.sessionId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return !term || searchable.includes(term);
      })
      .map((item) => ({
        id: item._id,
        ...item,
      }));
  }, [activity, searchTerm]);

  const deviceBreakdown = summary?.deviceBreakdown || [];
  const desktopCount = deviceBreakdown.find((item) => item._id === "desktop")?.count || 0;
  const mobileCount = deviceBreakdown.find((item) => item._id === "mobile")?.count || 0;

  const columns = [
    {
      field: "user",
      headerName: "Visitor",
      width: 230,
      renderCell: (params) => (
        <div>
          <div className="font-semibold text-gray-900">
            {params.row.userName || "Anonymous visitor"}
          </div>
          <div className="text-xs text-gray-500">{params.row.userEmail || "No email"}</div>
        </div>
      ),
    },
    {
      field: "actionType",
      headerName: "Action",
      width: 170,
      renderCell: (params) => (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {getActionIcon(params.row.actionType)}
          {formatActionType(params.row.actionType)}
        </span>
      ),
    },
    {
      field: "action",
      headerName: "Details",
      width: 220,
      renderCell: (params) => (
        <span className="truncate text-sm text-gray-700">{params.row.action || "-"}</span>
      ),
    },
    {
      field: "pageUrl",
      headerName: "Page",
      width: 230,
      renderCell: (params) => (
        <span className="truncate text-sm text-gray-700" title={params.row.pageUrl}>
          {params.row.pageUrl || "-"}
        </span>
      ),
    },
    {
      field: "device",
      headerName: "Device",
      width: 180,
      renderCell: (params) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {getDeviceIcon(params.row.deviceType)}
          <div>
            <div className="font-semibold capitalize">{params.row.deviceType || "unknown"}</div>
            <div className="text-xs text-gray-500">{params.row.browser || "Unknown browser"}</div>
          </div>
        </div>
      ),
    },
    {
      field: "location",
      headerName: "Location",
      width: 170,
      renderCell: (params) => (
        <div className="text-sm text-gray-700">
          <div>{params.row.city && params.row.city !== "unknown" ? params.row.city : "Unknown"}</div>
          <div className="text-xs text-gray-500">
            {params.row.country && params.row.country !== "unknown"
              ? params.row.country
              : "Unknown country"}
          </div>
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: "Time",
      width: 180,
      renderCell: (params) => (
        <span className="text-sm text-gray-600">{formatDateTime(params.row.createdAt)}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => setSelectedRow(params.row)}
          className="rounded bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tracking & Analytics</h1>
            <p className="mt-2 text-gray-600">
              Review visitor behavior, device mix, popular pages, and recent user actions.
            </p>
          </div>

          <button
            onClick={() => fetchAnalyticsData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <FaRedo className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard label="Page Views" value={summary?.totalPageViews || 0} icon={<FaEye />} color="bg-blue-100 text-blue-700" />
          <StatCard label="Unique Visitors" value={summary?.uniqueVisitors || 0} icon={<FaUsers />} color="bg-green-100 text-green-700" />
          <StatCard label="Desktop" value={desktopCount} icon={<FaDesktop />} color="bg-purple-100 text-purple-700" />
          <StatCard label="Mobile" value={mobileCount} icon={<FaMobile />} color="bg-yellow-100 text-yellow-700" />
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search visitors, actions, pages, device, location..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(Number(e.target.value));
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none"
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none"
              >
                <option value="all">All actions</option>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto p-6">
            <div className="min-w-[1500px]">
              <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                rowCount={rowCount}
                paginationMode="server"
                disableRowSelectionOnClick
                autoHeight
                rowHeight={68}
                sx={gridSx}
              />
            </div>
          </div>
        </div>

        {summary?.popularPages?.length > 0 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Popular Pages</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {summary.popularPages.slice(0, 6).map((page) => (
                <div key={page.pageUrl} className="rounded-lg border border-gray-100 p-4">
                  <div className="truncate font-semibold text-gray-900">{page.pageUrl}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {page.visits} visits | {page.uniqueVisitors} unique
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedRow && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedRow(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Activity Details</h2>
                  <p className="mt-1 text-sm text-gray-500">{formatDateTime(selectedRow.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <Detail label="User" value={selectedRow.userName || "Anonymous"} />
                <Detail label="Email" value={selectedRow.userEmail || "Not provided"} />
                <Detail label="Action" value={formatActionType(selectedRow.actionType)} />
                <Detail label="Details" value={selectedRow.action || "-"} />
                <Detail label="Page" value={selectedRow.pageUrl || "-"} />
                <Detail label="Device" value={`${selectedRow.deviceType || "unknown"} / ${selectedRow.browser || "unknown"}`} />
                <Detail label="Location" value={`${selectedRow.city || "Unknown"}, ${selectedRow.country || "Unknown"}`} />
                <Detail label="Session" value={selectedRow.sessionId || "-"} />
                <Detail label="IP" value={selectedRow.ipAddress || "-"} />
                <Detail label="Screen" value={selectedRow.screenResolution || "-"} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Detail = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-3">
    <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
    <div className="mt-1 break-words font-medium text-gray-900">{value}</div>
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

export default Analytics;
