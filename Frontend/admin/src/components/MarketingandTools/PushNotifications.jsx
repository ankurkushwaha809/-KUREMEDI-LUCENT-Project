import React, { useState } from "react";
import { Download, Plus, Send } from "lucide-react";

const PushNotifications = () => {
  const [audience, setAudience] = useState("All Retailers");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    // Backend API call later
    console.log({
      audience,
      title,
      message,
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Marketing Tools
          </h1>
          <p className="text-gray-500">
            Manage campaigns, banners, offers, and notifications
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-100">
            <Download size={16} />
            Export Data
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} />
            Create New
          </button>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-6 border-b mb-6">
        {["Campaigns", "Banners", "Offers & Schemes", "Push Notifications"].map(
          (tab) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-medium transition
                ${
                  tab === "Push Notifications"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* ================= FORM CARD ================= */}
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">

        <h2 className="text-lg font-semibold mb-4">
          Send Push Notification
        </h2>

        {/* Target Audience */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Target Audience
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All Retailers</option>
            <option>All Agencies</option>
            <option>Active Users</option>
            <option>Inactive Users</option>
          </select>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            rows={4}
            placeholder="Notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Send size={16} />
          Send Notification
        </button>

      </div>
    </div>
  );
};

export default PushNotifications;
