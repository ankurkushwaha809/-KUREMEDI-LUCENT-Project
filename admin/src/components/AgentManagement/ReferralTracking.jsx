import React, { useState, useEffect } from "react";
import { useContextApi } from "../../hooks/useContextApi";

export default function ReferralTracking() {
  const { getReferralsTracking } = useContextApi();
  const [data, setData] = useState({ total: 0, referrals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getReferralsTracking();
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load referrals");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [getReferralsTracking]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Referral Tracking</h1>
        <p className="text-gray-500">All referral types: R→R, MR→R, MR→MR. Count when referee completes KYC. Amounts set in Referral Settings.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <p className="text-gray-600">
          <span className="font-semibold">{data.total}</span> total referral(s)
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Referrer</th>
                <th className="p-3 text-left">Referral Code</th>
                <th className="p-3 text-left">Referee</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">KYC Status</th>
                <th className="p-3 text-left">Credited</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">Loading...</td>
                </tr>
              )}
              {!loading && data.referrals?.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">No referrals yet</td>
                </tr>
              )}
              {!loading &&
                data.referrals?.map((item, i) => (
                  <tr key={item.retailer?._id || i} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{item.referralType || "—"}</span>
                    </td>
                    <td className="p-3 font-medium">{item.agent?.name ?? item.referrerUser?.name ?? "—"}</td>
                    <td className="p-3 font-mono text-xs">{item.agent?.referralCode ?? item.referrerUser?.referralCode ?? "—"}</td>
                    <td className="p-3">{item.retailer?.name || "—"}</td>
                    <td className="p-3">
                      <div>{item.retailer?.phone || "—"}</div>
                      {item.retailer?.email && (
                        <div className="text-gray-500 text-xs">{item.retailer.email}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.retailer?.kyc === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : item.retailer?.kyc === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.retailer?.kyc || "BLANK"}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.retailer?.credited ? (
                        <span className="text-green-600 text-xs font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {item.retailer?.createdAt
                        ? new Date(item.retailer.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
