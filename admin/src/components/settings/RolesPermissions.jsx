import React, { useState } from "react";
import { User, Lock, Settings } from "lucide-react";

export default function GeneralSettings() {
  const [settings, setSettings] = useState({
    siteName: "My Dashboard",
    enableNotifications: true,
    defaultRole: "User",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    alert("Settings saved!");
    // Integrate API call here
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
        <p className="text-gray-500 mt-1">Configure your system preferences</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl flex flex-col gap-6">
        {/* Site Name */}
        <div>
          <label className="block text-gray-700 mb-1 flex items-center gap-2">
            <Settings size={16} /> Site Name
          </label>
          <input
            type="text"
            name="siteName"
            value={settings.siteName}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Enable Notifications */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="enableNotifications"
            checked={settings.enableNotifications}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label className="text-gray-700">Enable Notifications</label>
        </div>

        {/* Default Role */}
        <div>
          <label className="block text-gray-700 mb-1 flex items-center gap-2">
            <User size={16} /> Default Role
          </label>
          <select
            name="defaultRole"
            value={settings.defaultRole}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option>User</option>
            <option>Admin</option>
            <option>Manager</option>
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium w-32"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
