import React, { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, User } from "lucide-react";

const PendingVerifications = () => {
  /* ================= STATE ================= */
  const [verifications, setVerifications] = useState([]);

  /* ================= LOAD DATA (Dummy) ================= */
  useEffect(() => {
    const data = [
      {
        id: 1,
        name: "Rahul Sharma",
        type: "Agent",
        submittedOn: "2026-02-01",
        status: "Pending",
      },
      {
        id: 2,
        name: "Amit Verma",
        type: "Retailer",
        submittedOn: "2026-02-03",
        status: "Pending",
      },
      {
        id: 3,
        name: "Neha Singh",
        type: "Agent",
        submittedOn: "2026-02-04",
        status: "Pending",
      },
    ];

    setVerifications(data);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Verifications</h1>
        <p className="text-gray-500 mt-1">Review pending KYC and verification requests</p>
      </div>

      {/* ================= PENDING TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Type</th>
              <th className="text-left py-3">Submitted On</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {verifications.map((v) => (
              <tr key={v.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium flex items-center gap-2"><User size={16} /> {v.name}</td>
                <td className="py-3">{v.type}</td>
                <td className="py-3">{v.submittedOn}</td>
                <td className="py-3"><StatusBadge status={v.status} /></td>
                <td className="py-3 flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                </td>
              </tr>
            ))}

            {verifications.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">No pending verifications</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingVerifications;

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  const map = {
    Pending: "bg-orange-100 text-orange-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return <span className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}>{status}</span>;
};