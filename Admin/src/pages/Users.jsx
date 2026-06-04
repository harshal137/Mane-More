import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import {
  FaEnvelope,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTrash,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";
import { userRequest } from "../requestMethods";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const fetchUsers = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const res = await userRequest.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Fetch users error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this user? This will also permanently delete this user's orders and payments."
      )
    ) {
      return;
    }

    try {
      const res = await userRequest.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
      alert(
        `${res.data?.message || "User deleted successfully"}\nOrders deleted: ${
          res.data?.deletedOrders || 0
        }\nPayments deleted: ${res.data?.deletedPayments || 0}`
      );
    } catch (error) {
      console.log("Delete user error:", error);
      alert(error.response?.data?.message || "User delete failed");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitial = (name, email) =>
    (name || email || "U").trim().charAt(0).toUpperCase();

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const role = String(user.role || "user").toLowerCase();
      const searchable = [user._id, user.name, user.email, user.phone, role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (roleFilter === "all" || role === roleFilter) &&
        (!term || searchable.includes(term))
      );
    });
  }, [roleFilter, searchTerm, users]);

  const metrics = useMemo(() => {
    const admins = users.filter(
      (user) => String(user.role || "").toLowerCase() === "admin"
    );
    const customers = users.filter(
      (user) => String(user.role || "user").toLowerCase() !== "admin"
    );
    const now = new Date();
    const thisMonth = users.filter((user) => {
      if (!user.createdAt) return false;
      const createdAt = new Date(user.createdAt);
      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    });

    return {
      total: users.length,
      customers: customers.length,
      admins: admins.length,
      thisMonth: thisMonth.length,
    };
  }, [users]);

  const columns = [
    {
      field: "_id",
      headerName: "User ID",
      width: 140,
      renderCell: (params) => (
        <span className="font-mono text-sm text-gray-600">
          #{params.row._id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      field: "profile",
      headerName: "Profile",
      width: 280,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
            {getInitial(params.row.name, params.row.email)}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {params.row.name || "Unnamed user"}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <FaEnvelope />
              {params.row.email || "No email"}
            </div>
          </div>
        </div>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{params.row.phone || "Not added"}</span>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      renderCell: (params) => {
        const role = String(params.row.role || "user").toLowerCase();

        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              role === "admin"
                ? "bg-purple-100 text-purple-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {role}
          </span>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Joined",
      width: 140,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{formatDate(params.row.createdAt)}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleDelete(params.row._id)}
          className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
        >
          <FaTrash size={12} />
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">
              Review registered customers, admin accounts, and recent signups.
            </p>
          </div>

          <button
            onClick={() => fetchUsers({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <FaRedo className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard label="Total Accounts" value={metrics.total} icon={<FaUsers />} color="bg-blue-100 text-blue-700" />
          <StatCard label="Customers" value={metrics.customers} icon={<FaUserCheck />} color="bg-green-100 text-green-700" />
          <StatCard label="Admins" value={metrics.admins} icon={<FaShieldAlt />} color="bg-purple-100 text-purple-700" />
          <StatCard label="New This Month" value={metrics.thisMonth} icon={<FaUserCheck />} color="bg-yellow-100 text-yellow-700" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-lg flex-1">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, role, or ID..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 outline-none"
                >
                  <option value="all">All roles</option>
                  <option value="user">Customers</option>
                  <option value="admin">Admins</option>
                </select>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
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
                rows={filteredUsers}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
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

const gridSx = {
  border: "none",
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid #f3f4f6",
    py: 1,
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

export default Users;
