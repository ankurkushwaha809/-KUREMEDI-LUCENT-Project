import React, { useState } from "react";
import {
  Download,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  Filter
} from "lucide-react";

const Commissions = () => {
  // Backend data will come later
  const commissions = [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commission & Referral Management
          </h1>
          <p className="text-gray-500">
            Manage agent commissions and payouts
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Commission (This Month)"
          value="₹0.00"
          icon={<DollarSign className="text-blue-600" />}
          bg="bg-blue-100"
        />
        <StatCard
          title="Pending Approvals"
          value="₹0.00"
          icon={<Clock className="text-orange-600" />}
          bg="bg-orange-100"
        />
        <StatCard
          title="Approved (Unpaid)"
          value="₹0.00"
          icon={<CheckCircle className="text-green-600" />}
          bg="bg-green-100"
        />
        <StatCard
          title="Paid"
          value="₹0.00"
          icon={<DollarSign className="text-indigo-600" />}
          bg="bg-indigo-100"
        />
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row gap-4">

        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-3 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by agent or reference..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select className="border rounded-lg px-3 py-2 text-sm">
          <option>All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Paid</option>
        </select>

        <select className="border rounded-lg px-3 py-2 text-sm">
          <option>All Types</option>
          <option>Referral</option>
          <option>Commission</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">
                <input type="checkbox" />
              </th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Agent Name</th>
              <th className="p-3 text-left">Commission Type</th>
              <th className="p-3 text-left">Reference</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {commissions.length === 0 && (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-16 text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter size={40} className="text-gray-300" />
                    <p className="font-medium">
                      No commissions found
                    </p>
                    <p className="text-sm">
                      Try adjusting your filters
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Backend mapping later */}
            {/* commissions.map(...) */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, bg }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          {title}
        </p>
        <h3 className="text-xl font-bold text-gray-900">
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-lg ${bg}`}>
        {icon}
      </div>
    </div>
  );
};

export default Commissions;
