import React, { useState } from "react";
import { Search } from "lucide-react";

export default function AgencyManagement() {
  const [activeTab, setActiveTab] = useState("All");

  // Dummy data (API later)
  const agencies = [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Agency Management
        </h1>
        <p className="text-gray-500">
          Manage and monitor all registered agencies
        </p>
      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="bg-white rounded-xl shadow p-6">

        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">

          {/* Left Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All Agencies
            </h2>
            <p className="text-sm text-gray-500">
              Total: {agencies.length} agencies
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search agencies..."
                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Tabs */}
            {["All", "Pending", "Approved", "Rejected"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${
                    activeTab === tab
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {tab}
              </button>
            ))}

          </div>
        </div>

        {/* ================= EMPTY STATE ================= */}
        <div className="border rounded-lg py-20 text-center text-gray-500">
          No agencies found
        </div>

      </div>
    </div>
  );
}
