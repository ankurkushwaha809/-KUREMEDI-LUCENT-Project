import React, { useEffect, useState } from "react";
import { IndianRupee, Clock, CheckCircle, XCircle } from "lucide-react";

const Withdrawals = () => {
  /* ================= STATE ================= */
  const [withdrawals, setWithdrawals] = useState([]);

  /* ================= LOAD DATA (Dummy) ================= */
  useEffect(() => {
    const data = [
      {
        id: 1,
        user: "Rahul Sharma",
        amount: 5000,
        method: "Bank Transfer",
        date: "2026-02-01",
        status: "Success",
      },
      {
        id: 2,
        user: "Amit Verma",
        amount: 2500,
        method: "UPI",
        date: "2026-02-02",
        status: "Processing",
      },
      {
        id: 3,
        user: "Neha Singh",
        amount: 3000,
        method: "Wallet",
        date: "2026-02-03",
        status: "Failed",
      },
    ];

    setWithdrawals(data);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-500 mt-1">Track user withdrawal requests</p>
      </div>

      {/* ================= WITHDRAWALS TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">User</th>
              <th className="text-left py-3">Amount</th>
              <th className="text-left py-3">Method</th>
              <th className="text-left py-3">Date</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium">{w.user}</td>

                <td className="py-3 flex items-center gap-1">
                  <IndianRupee size={14} /> {w.amount}
                </td>

                <td className="py-3">{w.method}</td>

                <td className="py-3">{w.date}</td>

                <td className="py-3">
                  <StatusBadge status={w.status} />
                </td>

                <td className="py-3 flex gap-2">
                  {w.status === "Processing" && (
                    <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Approve
                    </button>
                  )}
                  {w.status === "Processing" && (
                    <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {withdrawals.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No withdrawal requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Withdrawals;

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  const map = {
    Success: "bg-green-100 text-green-700",
    Processing: "bg-orange-100 text-orange-700",
    Failed: "bg-red-100 text-red-700",
  };

  return <span className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}>{status}</span>;
};