import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Trash2 } from "lucide-react";

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([]);

  // Dummy notifications
  useEffect(() => {
    const data = [
      {
        id: 1,
        title: "New Order Received",
        message: "Order #1245 has been placed successfully.",
        status: "Unread",
        date: "2026-02-05 10:24 AM",
      },
      {
        id: 2,
        title: "Stock Alert",
        message: "Product 'XYZ' stock is low.",
        status: "Unread",
        date: "2026-02-04 04:12 PM",
      },
      {
        id: 3,
        title: "Payment Successful",
        message: "Payment of ₹12,500 has been credited.",
        status: "Read",
        date: "2026-02-03 02:45 PM",
      },
    ];
    setNotifications(data);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "Read" } : n))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">All Notifications</h1>
        <p className="text-gray-500 mt-1">
          Manage and view all notifications
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        {notifications.length === 0 && (
          <p className="text-center text-gray-500 py-6">
            No notifications found
          </p>
        )}

        <ul className="divide-y">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex flex-col md:flex-row justify-between items-start md:items-center py-4 ${
                n.status === "Unread" ? "bg-gray-50" : ""
              } px-3 rounded-md hover:bg-gray-100 transition`}
            >
              <div className="flex items-start md:items-center gap-3">
                <Bell
                  className={`mt-1 md:mt-0 ${
                    n.status === "Unread" ? "text-blue-500" : "text-gray-400"
                  }`}
                  size={20}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{n.title}</h3>
                  <p className="text-gray-500 text-sm">{n.message}</p>
                  <p className="text-gray-400 text-xs mt-1">{n.date}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3 md:mt-0">
                {n.status === "Unread" && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <CheckCircle size={16} />
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
