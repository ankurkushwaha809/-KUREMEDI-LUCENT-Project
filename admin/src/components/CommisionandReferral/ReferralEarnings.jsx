import React, { useState } from "react";

const ReferralEarnings = () => {
  const [active, setActive] = useState(true);
  const [amount, setAmount] = useState(5000);

  const handleSave = () => {
    // Backend API integration later
    console.log({
      active,
      amount,
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= MAIN CARD ================= */}
      <div className="bg-white rounded-xl shadow p-6 max-w-4xl">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold">
              Referral Wallet Bonus
            </h2>
            <p className="text-sm text-gray-500">
              Amount credited to agent wallet per successful retailer referral
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={() => setActive(!active)}
                className="accent-blue-600"
              />
              Active
            </label>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>

        {/* Wallet Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Wallet Amount Per Referral (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            ₹{amount.toLocaleString()} will be added to agent wallet
          </p>
        </div>

        {/* Example Box */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">
            Example:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Agent refers 1 retailer → Wallet Credit: ₹5,000</li>
            <li>Agent refers 5 retailers → Total Wallet Credit: ₹25,000</li>
            <li>Agent refers 10 retailers → Total Wallet Credit: ₹50,000</li>
          </ul>
        </div>

      </div>

      {/* ================= IMPORTANT NOTES ================= */}
      <div className="max-w-4xl mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">
          Important Notes:
        </h3>
        <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
          <li>
            <strong>Onboarding Commission:</strong> Paid through commission payout system after approval
          </li>
          <li>
            <strong>Wallet Bonus:</strong> Automatically credited to agent wallet upon retailer approval
          </li>
          <li>
            Changes to these settings will apply to all future referrals/onboardings only
          </li>
          <li>
            Existing pending commissions will not be affected by changes
          </li>
          <li>
            Agents can view wallet balance and commission history in their dashboard
          </li>
          <li>
            Wallet balance can be withdrawn or used for purchases
          </li>
        </ul>
      </div>

    </div>
  );
};

export default ReferralEarnings;
