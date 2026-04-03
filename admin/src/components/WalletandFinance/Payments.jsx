import React, { useEffect, useState } from "react";
import { IndianRupee, Clock, CheckCircle, XCircle } from "lucide-react";

const Payments = () => {
  /* ================= STATE ================= */
  const [transactions, setTransactions] = useState([]);

  /* ================= LOAD DATA (Dummy) ================= */
  useEffect(() => {
    const data = [
      {
        id: 1,
        type: "Credit",
        amount: 5000,
        user: "Rahul Sharma",
        method: "UPI",
        date: "2026-02-01",
        status: "Success",
      },
      {
        id: 2,
        type: "Debit",
        amount: 2500,
        user: "Amit Verma",
        method: "Bank",
        date: "2026-02-02",
        status: "Processing",
      },
      {
        id: 3,
        type: "Credit",
        amount: 3000,
        user: "Neha Singh",
        method: "Wallet",
        date: "2026-02-03",
        status: "Failed",
      },
    ];

    setTransactions(data);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">All payment transactions</p>
      </div>

      {/* ================= TRANSACTIONS TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">User</th>
              <th className="text-left py-3">Type</th>
              <th className="text-left py-3">Amount</th>
              <th className="text-left py-3">Method</th>
              <th className="text-left py-3">Date</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium">{t.user}</td>

                <td className={`py-3 font-semibold ${t.type === "Credit" ? "text-green-600" : "text-red-600"}`}>
                  {t.type}
                </td>

                <td className="py-3 flex items-center gap-1">
                  <IndianRupee size={14} /> {t.amount}
                </td>

                <td className="py-3">{t.method}</td>

                <td className="py-3">{t.date}</td>

                <td className="py-3">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  const map = {
    Success: "bg-green-100 text-green-700",
    Processing: "bg-orange-100 text-orange-700",
    Failed: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}>{status}</span>
  );
};