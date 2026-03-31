import React, { useEffect, useState } from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  IndianRupee,
  Clock,
} from "lucide-react";

const WalletOverview = () => {
  /* ================= STATE ================= */
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  /* ================= LOAD DATA (Dummy for Now) ================= */
  useEffect(() => {
    // Replace with API later
    const data = {
      balance: 25450,
      transactions: [
        {
          id: 1,
          type: "Credit",
          amount: 5000,
          source: "Commission",
          date: "2026-02-01",
          status: "Success",
        },
        {
          id: 2,
          type: "Debit",
          amount: 2500,
          source: "Payout",
          date: "2026-02-02",
          status: "Processing",
        },
        {
          id: 3,
          type: "Credit",
          amount: 8000,
          source: "Referral Bonus",
          date: "2026-02-03",
          status: "Success",
        },
      ],
    };

    setBalance(data.balance);
    setTransactions(data.transactions);
  }, []);

  /* ================= CALCULATIONS ================= */
  const totalCredit = transactions
    .filter((t) => t.type === "Credit")
    .reduce((a, b) => a + b.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === "Debit")
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Wallet Overview
        </h1>
        <p className="text-gray-500 mt-1">
          Track balance, earnings, and payouts
        </p>
      </div>

      {/* ================= BALANCE CARD ================= */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">Available Balance</p>
            <h2 className="text-4xl font-bold mt-2 flex items-center gap-2">
              <IndianRupee size={28} /> {balance}
            </h2>
          </div>

          <Wallet size={48} className="opacity-80" />
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Credit"
          value={totalCredit}
          icon={<ArrowDownCircle size={22} />}
          color="green"
        />

        <StatCard
          title="Total Debit"
          value={totalDebit}
          icon={<ArrowUpCircle size={22} />}
          color="red"
        />

        <StatCard
          title="Pending"
          value={transactions.filter((t) => t.status === "Processing").length}
          icon={<Clock size={22} />}
          color="orange"
        />
      </div>

      {/* ================= TRANSACTIONS ================= */}
      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>

        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">Type</th>
              <th className="text-left py-3">Amount</th>
              <th className="text-left py-3">Source</th>
              <th className="text-left py-3">Date</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3 font-medium">{t.type}</td>

                <td
                  className={`py-3 font-semibold ${
                    t.type === "Credit"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ₹{t.amount}
                </td>

                <td className="py-3">{t.source}</td>

                <td className="py-3">{t.date}</td>

                <td className="py-3">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-6 text-gray-500"
                >
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

export default WalletOverview;

/* ================= STAT CARD ================= */

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-500",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold mt-1">₹{value}</h2>
      </div>

      <div className={colors[color] || "text-gray-500"}>{icon}</div>
    </div>
  );
};

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  const map = {
    Success: "bg-green-100 text-green-700",
    Processing: "bg-orange-100 text-orange-700",
    Failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
};
