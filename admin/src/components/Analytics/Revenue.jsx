import React, { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

export default function Revenue() {
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    monthlyGrowth: 0,
  });

  // Dummy fetch simulation
  useEffect(() => {
    const data = {
      totalRevenue: 1250000,
      totalOrders: 348,
      monthlyGrowth: 12, // in percentage
    };
    setSalesData(data);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales Overview</h1>
        <p className="text-gray-500 mt-1">
          Track your revenue, orders, and growth trends
        </p>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={`₹${salesData.totalRevenue.toLocaleString()}`}
          icon={<DollarSign size={22} />}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={salesData.totalOrders}
          icon={<ShoppingCart size={22} />}
          color="blue"
        />
        <StatCard
          title="Monthly Growth"
          value={`${salesData.monthlyGrowth}%`}
          icon={<TrendingUp size={22} />}
          color="purple"
        />
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-5 h-64 flex items-center justify-center text-gray-400">
        Sales Chart will go here
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
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
