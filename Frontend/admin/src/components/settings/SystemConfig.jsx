import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";

export default function SystemConfig() {
  let rawBase = import.meta.env.VITE_BASE_URL || "https://api.kuremedi.com/api";
  rawBase = rawBase.trim();
  rawBase = rawBase.replace("https:/.kuremedi.com", "https://api.kuremedi.com");
  const BASE_URL = rawBase.replace(/\/$/, "");

  const [config, setConfig] = useState({
    minimumCheckoutAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/config/minimum-checkout-amount`);
        const amount = Number(res?.data?.amount || 0);
        setConfig({
          minimumCheckoutAmount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load minimum checkout value");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const amount = Math.max(0, Number(config.minimumCheckoutAmount) || 0);
    setSaving(true);
    try {
      const res = await axios.put(`${BASE_URL}/config/minimum-checkout-amount`, {
        amount,
      });
      setConfig((prev) => ({
        ...prev,
        minimumCheckoutAmount: Number(res?.data?.amount ?? amount),
      }));
      toast.success("Minimum checkout value saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save minimum checkout value");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-500 mt-1">Manage checkout rules</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl flex flex-col gap-6">
        <div>
          <label className="text-gray-700 mb-1 flex items-center gap-2">
            <Settings size={16} /> Minimum Checkout Price (INR)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="minimumCheckoutAmount"
            value={config.minimumCheckoutAmount}
            onChange={handleChange}
            placeholder="e.g. 500"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            disabled={loading || saving}
          />
          <p className="text-xs text-gray-500 mt-2">
            If checkout total is below this amount, users will see a message and cannot place the order.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium w-44"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
