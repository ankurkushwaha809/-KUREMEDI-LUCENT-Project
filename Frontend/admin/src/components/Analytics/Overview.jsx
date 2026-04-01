import React, { useState, useEffect } from "react";
import { User, Users, TrendingUp } from "lucide-react";

export default function Overview() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newSignups: 0,
  });

  // Dummy data fetch simulation
  useEffect(() => {
    // In real app, fetch from API
    const data = {
      totalUsers: 1245,
      activeUsers: 732,
      newSignups: 56,
    };
    setAnalytics(data);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Analytics</h1>
        <p className="text-gray-500 mt-1">
          Overview of user activity and growth
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={<Users size={22} />}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={analytics.activeUsers}
          icon={<User size={22} />}
          color="green"
        />
        <StatCard
          title="New Signups"
          value={analytics.newSignups}
          icon={<TrendingUp size={22} />}
          color="purple"
        />
      </div>

      {/* Placeholder for chart */}
      <div className="bg-white rounded-xl shadow-sm p-5 h-64 flex items-center justify-center text-gray-400">
        Chart will go here
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
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
