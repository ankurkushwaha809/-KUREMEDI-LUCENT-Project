import React, { useState } from "react";
import { Download } from "lucide-react";

function AgentManagement() {
  // Demo Data (Later connect API)
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true); // Simulate loading

  /* ================= FILTER ================= */
  const filteredAgents = agents.filter((agent) => {
    if (activeTab === "active") return agent.status === "active";
    if (activeTab === "pending") return agent.status === "pending";
    return true;
  });

  /* ================= COUNTS ================= */
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const pendingAgents = agents.filter((a) => a.status === "pending").length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agent Management</h1>
          <p className="text-gray-500 text-sm">
            Manage MR (Medical Representatives) and their performance
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-100">
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* ================= TABS ================= */}
      <div className="bg-white rounded-xl p-4 shadow mb-6 flex gap-3">
        {["all", "active", "pending"].map((tab) => {
          const label =
            tab === "all" ? `All Agents (${totalAgents})` :
            tab === "active" ? `Active (${activeAgents})` :
            `Pending (${pendingAgents})`;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab ? "bg-black text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl shadow animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-1">Agents List</h2>
        <p className="text-sm text-gray-500 mb-4">
          {loading ? "Loading agents..." : `${filteredAgents.length} agents found`}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b text-gray-600">
              <tr>
                {["ID","Agent Name","Contact","Territory","Retailers","Commission","Payout","Performance","Status","Actions"].map((th, idx) => (
                  <th key={idx} className="p-3 text-left">{th}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Placeholder rows */}
              {loading &&
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b">
                    {Array.from({ length: 10 }).map((_, cidx) => (
                      <td key={cidx} className="p-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              }

              {/* Empty State */}
              {!loading && filteredAgents.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-gray-500">
                    No agents found
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!loading && filteredAgents.map((agent, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3">{agent.id}</td>
                  <td className="p-3">{agent.name}</td>
                  <td className="p-3">{agent.phone}</td>
                  <td className="p-3">{agent.area}</td>
                  <td className="p-3">{agent.retailers}</td>
                  <td className="p-3">{agent.commission}%</td>
                  <td className="p-3">₹{agent.payout}</td>
                  <td className="p-3">{agent.performance}%</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        agent.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:underline text-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AgentManagement;
