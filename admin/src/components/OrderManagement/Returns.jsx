"use client";
import React, { useState } from "react";
import { Download } from "lucide-react";

const Orders = () => {
  const [activeTab, setActiveTab] = useState("All Orders");

  // Backend data later
  const orders = [];

  const stats = {
    totalOrders: orders.length,
    processing: orders.filter(o => o.status === "Processing").length,
    shipped: orders.filter(o => o.status === "Shipped").length,
    revenue: 0,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order Management
          </h1>
          <p className="text-gray-500">
            Track and manage all orders with complete details
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-100">
          <Download size={16} />
          Export Orders
        </button>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-2 mb-6">
        {["All Orders", "Pending", "Processing", "Shipped", "Delivered"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white border text-gray-700 hover:bg-gray-100"
                }`}
            >
              {tab} (0)
            </button>
          )
        )}
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Processing" value={stats.processing} />
        <StatCard title="Shipped" value={stats.shipped} />
        <StatCard title="Total Revenue" value={`₹${stats.revenue}`} />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Retailer</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Payment Status</th>
              <th className="p-3 text-left">Order Date</th>
              <th className="p-3 text-left">Delivery Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-10 text-gray-500"
                >
                  No orders found
                </td>
              </tr>
            )}

            {/* Future mapping */}
            {/*
            orders.map(order => (
              <tr key={order.id}>...</tr>
            ))
            */}
          </tbody>
        </table>

      </div>
    </div>
  );
};

/* ================= STAT CARD ================= */
const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500 mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-gray-900">
        {value}
      </h3>
    </div>
  );
};

export default Orders;
