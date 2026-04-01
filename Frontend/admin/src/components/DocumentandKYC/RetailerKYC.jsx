import React, { useState, useEffect } from "react";
import { FileText, User } from "lucide-react";

const RetailerKYC = () => {
  const [kycList, setKycList] = useState([]);

  useEffect(() => {
    const data = [
      { id: 1, retailerName: "Rahul Sharma", phone: "9876543210", email: "rahul@example.com", document: "aadhaar.pdf", status: "Verified", submittedOn: "2026-02-01" },
      { id: 2, retailerName: "Amit Verma", phone: "9123456780", email: "amit@example.com", document: "pan.pdf", status: "Pending", submittedOn: "2026-02-03" },
      { id: 3, retailerName: "Neha Singh", phone: "9988776655", email: "neha@example.com", document: "aadhaar.pdf", status: "Rejected", submittedOn: "2026-02-04" }
    ];
    setKycList(data);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Retailer KYC</h1>
        <p className="text-gray-500 mt-1">Verify retailer documents and details</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">Retailer Name</th>
              <th className="text-left py-3">Phone</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Document</th>
              <th className="text-left py-3">Submitted On</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {kycList.map((k) => (
              <tr key={k.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium flex items-center gap-2"><User size={16} /> {k.retailerName}</td>
                <td className="py-3">{k.phone}</td>
                <td className="py-3">{k.email}</td>
                <td className="py-3 flex items-center gap-2">
                  <FileText size={16} />
                  <a href={`/${k.document}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{k.document}</a>
                </td>
                <td className="py-3">{k.submittedOn}</td>
                <td className="py-3"><StatusBadge status={k.status} /></td>
                <td className="py-3 flex gap-2">
                  {k.status === "Pending" && (
                    <>
                      <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {kycList.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">No KYC submissions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Verified: "bg-green-100 text-green-700",
    Pending: "bg-orange-100 text-orange-700",
    Rejected: "bg-red-100 text-red-700",
  };
  return <span className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}>{status}</span>;
};

export default RetailerKYC;