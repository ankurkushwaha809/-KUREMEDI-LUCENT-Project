import React, { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle, Clock, IndianRupee } from "lucide-react";

const PayoutRequests = () => {
  /* ================= STATE ================= */
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  /* ================= DUMMY DATA (Replace with API Later) ================= */
  useEffect(() => {
    // Later you can replace this with API call
    const data = [
      {
        id: 1,
        name: "Rahul Sharma",
        amount: 4500,
        method: "UPI",
        account: "rahul@upi",
        status: "Pending",
        date: "2026-02-01",
      },
      {
        id: 2,
        name: "Amit Verma",
        amount: 12000,
        method: "Bank",
        account: "XXXX-4521",
        status: "Approved",
        date: "2026-02-02",
      },
      {
        id: 3,
        name: "Neha Singh",
        amount: 3000,
        method: "UPI",
        account: "neha@upi",
        status: "Rejected",
        date: "2026-02-03",
      },
    ];

    setRequests(data);
  }, []);

  /* ================= FILTER ================= */
  const filteredRequests = requests.filter((r) => {
    const matchSearch = r.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus =
      filterStatus === "All" || r.status === filterStatus;

    return matchSearch && matchStatus;
  });

  /* ================= ACTIONS ================= */
  const updateStatus = (id, status) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status } : r
      )
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Payout Requests
        </h1>
        <p className="text-gray-500 mt-1">
          Manage and process payout requests
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Requests"
          value={requests.length}
          icon={<Clock size={22} />}
        />

        <StatCard
          title="Pending"
          value={requests.filter((r) => r.status === "Pending").length}
          icon={<Clock size={22} />}
          color="orange"
        />

        <StatCard
          title="Approved"
          value={requests.filter((r) => r.status === "Approved").length}
          icon={<CheckCircle size={22} />}
          color="green"
        />

        <StatCard
          title="Rejected"
          value={requests.filter((r) => r.status === "Rejected").length}
          icon={<XCircle size={22} />}
          color="red"
        />
      </div>

      {/* ================= SEARCH & FILTER ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute top-3 left-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Amount</th>
              <th className="text-left py-3">Method</th>
              <th className="text-left py-3">Account</th>
              <th className="text-left py-3">Date</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((r) => (
              <tr
                key={r.id}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3 font-medium">{r.name}</td>

                <td className="py-3 flex items-center gap-1 font-semibold">
                  <IndianRupee size={14} /> {r.amount}
                </td>

                <td className="py-3">{r.method}</td>

                <td className="py-3">{r.account}</td>

                <td className="py-3">{r.date}</td>

                <td className="py-3">
                  <StatusBadge status={r.status} />
                </td>

                <td className="py-3 flex gap-2">
                  {r.status === "Pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(r.id, "Approved")}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(r.id, "Rejected")}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {filteredRequests.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500"
                >
                  No payout requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutRequests;

/* ================= STAT CARD ================= */

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    green: "text-green-600",
    orange: "text-orange-500",
    red: "text-red-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold mt-1">{value}</h2>
      </div>

      <div className={colors[color] || "text-gray-500"}>{icon}</div>
    </div>
  );
};

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  const map = {
    Pending: "bg-orange-100 text-orange-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
};
