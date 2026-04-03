import React, { useState } from "react";
import { Download, Plus, Pencil, Trash2 } from "lucide-react";

const Campaigns = () => {
  const [activeTab, setActiveTab] = useState("Campaigns");

  // Dummy data (replace with backend API)
  const campaigns = [
    {
      id: 1,
      name: "Year End Sale 2024",
      type: "Discount Campaign",
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      reach: 2456,
      status: "Active",
    },
    {
      id: 2,
      name: "New Product Launch",
      type: "Product Promotion",
      startDate: "2024-12-10",
      endDate: "2024-12-15",
      reach: 1234,
      status: "Active",
    },
  ];

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
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition
                ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Campaign Name</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Start Date</th>
              <th className="p-4 text-left">End Date</th>
              <th className="p-4 text-left">Reach</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-4">#{campaign.id}</td>
                <td className="p-4 font-medium text-gray-900">
                  {campaign.name}
                </td>
                <td className="p-4">{campaign.type}</td>
                <td className="p-4">{campaign.startDate}</td>
                <td className="p-4">{campaign.endDate}</td>
                <td className="p-4">{campaign.reach}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {campaign.status}
                  </span>
                </td>
                <td className="p-4 flex gap-3">
                  <button className="text-gray-500 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button className="text-gray-500 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default Campaigns;
