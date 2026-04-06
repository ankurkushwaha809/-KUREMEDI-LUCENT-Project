import React, { useState, useEffect } from "react";
import { useContextApi } from "../../hooks/useContextApi";

export default function AgentPerformance() {
  const { getAgents } = useContextApi();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getAgents();
        if (mounted) setAgents(data.agents || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load agents");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [getAgents]);

  const sortedByEarned = [...agents].sort((a, b) => (b.totalEarned ?? 0) - (a.totalEarned ?? 0));
  const sortedByRetailers = [...agents].sort((a, b) => (b.retailersOnboarded ?? 0) - (a.retailersOnboarded ?? 0));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Agent Performance</h1>
        <p className="text-gray-500">MR (Medical Representatives) performance and rankings</p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">By Commission Earned</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Agent Name</th>
                    <th className="p-3 text-left">Contact</th>
                    <th className="p-3 text-left">Total Earned</th>
                    <th className="p-3 text-left">Pending</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByEarned.length === 0 && (
                    <tr><td colSpan="6" className="p-4 text-center text-gray-500">No agents</td></tr>
                  )}
                  {sortedByEarned.map((agent, i) => (
                    <tr key={agent._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium">{agent.name || "—"}</td>
                      <td className="p-3">{agent.phone || "—"}</td>
                      <td className="p-3">₹{(agent.totalEarned ?? 0).toFixed(2)}</td>
                      <td className="p-3">₹{(agent.totalPending ?? 0).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${agent.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {agent.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">By Retailers Onboarded</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Agent Name</th>
                    <th className="p-3 text-left">Territory</th>
                    <th className="p-3 text-left">Retailers</th>
                    <th className="p-3 text-left">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByRetailers.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">No agents</td></tr>
                  )}
                  {sortedByRetailers.map((agent, i) => (
                    <tr key={agent._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium">{agent.name || "—"}</td>
                      <td className="p-3">{agent.territory || "—"}</td>
                      <td className="p-3">{agent.retailersOnboarded ?? 0}</td>
                      <td className="p-3">₹{(agent.totalEarned ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
