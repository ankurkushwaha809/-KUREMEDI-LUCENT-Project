import React, { useEffect, useState } from "react";
import { useContextApi } from "../../hooks/useContextApi";
import { Gift, Loader2, Save } from "lucide-react";

const DEFAULT_REWARDS = {
  retailerReferrer: 50,
  retailerReferee: 50,
  mrToRetailerMr: 500,
  mrToRetailerRetailer: 50,
  mrToMr: 700,
  mrToMrReferrer: 700,
  mrToMrReferee: 500,
};

const ReferralSettings = () => {
  const { getReferralRewards, setReferralRewards } = useContextApi();
  const [rewards, setRewards] = useState({ ...DEFAULT_REWARDS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getReferralRewards();
        setRewards({ ...DEFAULT_REWARDS, ...data });
      } catch {
        setRewards({ ...DEFAULT_REWARDS });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getReferralRewards]);

  const handleChange = (key, value) => {
    const n = Math.max(0, Math.min(100000, Math.round(Number(value)) || 0));
    setRewards((prev) => ({ ...prev, [key]: n }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setReferralRewards(rewards);
      alert("Referral rewards updated successfully!");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Referral Rewards</h1>
        <p className="text-gray-500 mt-1">
          Set amounts (₹) credited when a referred user completes KYC. All apply to future KYC approvals only.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Retailer → Retailer */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Gift size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Retailer → Retailer</h2>
                <p className="text-sm text-gray-500">When a retailer refers another retailer (both get amount)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referrer gets (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={rewards.retailerReferrer}
                  onChange={(e) => handleChange("retailerReferrer", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referee gets (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={rewards.retailerReferee}
                  onChange={(e) => handleChange("retailerReferee", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* MR → Retailer */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">MR (Agent) → Retailer</h2>
            <p className="text-sm text-gray-500 mb-4">When an MR refers a retailer and retailer KYC is approved</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MR gets (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={rewards.mrToRetailerMr}
                  onChange={(e) => handleChange("mrToRetailerMr", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retailer gets (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={rewards.mrToRetailerRetailer}
                  onChange={(e) => handleChange("mrToRetailerRetailer", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* MR → MR */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">MR → MR</h2>
            <p className="text-sm text-gray-500 mb-4">
              When an MR refers another MR and the referred MR&apos;s KYC is approved.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referrer MR gets (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={rewards.mrToMrReferrer}
                  onChange={(e) => handleChange("mrToMrReferrer", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New MR (referred) gets (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={rewards.mrToMrReferee}
                  onChange={(e) => handleChange("mrToMrReferee", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save all
          </button>
        </div>
      )}

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl">
        <h3 className="font-semibold text-amber-800 mb-2">Summary</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• <strong>Retailer app:</strong> Retailer uses another retailer’s code → both get ₹{rewards.retailerReferrer}/₹{rewards.retailerReferee} when referee KYC is approved.</li>
          <li>• <strong>MR app → Retailer:</strong> Retailer uses MR’s code → MR gets ₹{rewards.mrToRetailerMr}, retailer gets ₹{rewards.mrToRetailerRetailer} on KYC approval.</li>
          <li>• <strong>MR → MR:</strong> New MR signs up with existing MR’s code → referrer MR gets ₹{rewards.mrToMrReferrer}, new MR gets ₹{rewards.mrToMrReferee} when the referred MR’s KYC is approved.</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralSettings;
