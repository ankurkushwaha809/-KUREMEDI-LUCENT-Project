import React, { useState } from "react";
import { Settings, Globe, Cpu, ToggleLeft } from "lucide-react";

export default function SystemConfig() {
  const [config, setConfig] = useState({
    systemName: "My System",
    maintenanceMode: false,
    defaultTimezone: "UTC",
    apiKey: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    // Simulate saving settings (replace with API call)
    alert("System configuration saved successfully!");
    console.log("Saved config:", config);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-500 mt-1">Configure system-wide settings</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl flex flex-col gap-6">
        {/* System Name */}
        <div>
          <label className="block text-gray-700 mb-1 flex items-center gap-2">
            <Settings size={16} /> System Name
          </label>
          <input
            type="text"
            name="systemName"
            value={config.systemName}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="maintenanceMode"
            checked={config.maintenanceMode}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label className="text-gray-700 flex items-center gap-1">
            <ToggleLeft size={16} /> Maintenance Mode
          </label>
        </div>

        {/* Default Timezone */}
        <div>
          <label className="block text-gray-700 mb-1 flex items-center gap-2">
            <Globe size={16} /> Default Timezone
          </label>
          <select
            name="defaultTimezone"
            value={config.defaultTimezone}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option>UTC</option>
            <option>GMT</option>
            <option>Asia/Kolkata</option>
            <option>America/New_York</option>
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-gray-700 mb-1 flex items-center gap-2">
            <Cpu size={16} /> API Key
          </label>
          <input
            type="text"
            name="apiKey"
            value={config.apiKey}
            onChange={handleChange}
            placeholder="Enter your API key"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium w-36"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
