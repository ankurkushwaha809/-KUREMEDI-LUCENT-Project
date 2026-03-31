import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContextApi } from "../hooks/useContextApi";


/* ================= BACKEND CONFIG ================= */

let rawBase = import.meta.env.VITE_BASE_URL || "https://api.kuremedi.com/api";
rawBase = rawBase.trim().replace("https:/.kuremedi.com", "https://api.kuremedi.com");
const API_BASE = rawBase.replace(/\/$/, "");
const UPLOAD_BASE = rawBase.replace(/\/api\/?$/, "") || "https://api.kuremedi.com";
const fileUrl = (file) =>
  file ? `${UPLOAD_BASE}/uploads/${String(file).replace(/^\/+/, "").replace(/\\/g, "/")}` : null;

const updateKYCStatus = async (userId, status) => {
  try {
    const response = await axios.put(`${API_BASE}/auth/kyc-status/${userId}`, {
      status,
    }, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
    console.log("✅ KYC status updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating KYC status:", error.response?.data || error);
    throw error;
  }
};

/* ================= MAIN COMPONENT ================= */

export default function AllRetailer() {
  const { getAllUsers, reprocessReferralReward } = useContextApi();
  const [reprocessing, setReprocessing] = useState(false);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= FETCH USERS ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAllUsers();
        setUsers(res?.users || res || []);
      } catch (err) {
        console.log("Error:", err);
      }
    };
    fetchData();
  }, [getAllUsers]);

  useEffect(() => () => { }, []);

  /* ================= FILTER & PAGINATION ================= */

  const filtered = useMemo(() =>
    users.filter((r) => {
      const email = r?.email || "";
      const phone = r?.phone || "";
      const matchSearch = email.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
      if (filter === "All") return matchSearch;
      return matchSearch && r.kyc === filter;
    }),
    [users, search, filter]
  );

  useEffect(() => setCurrentPage(1), [search, filter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedRetailers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const goToPage = (n) => {
    setCurrentPage(Math.max(1, Math.min(n, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= UPDATE STATUS ================= */
  const handleSubmit = async () => {
    try {
      // 🔥 Call backend API
      await updateKYCStatus(selectedRetailer._id, updatedStatus);

      // 🔄 Update UI after success
      const updatedUsers = users.map((u) =>
        u._id === selectedRetailer._id
          ? { ...u, kyc: updatedStatus }
          : u
      );

      setUsers(updatedUsers);
      setSelectedRetailer(null);
      alert("✅ KYC Status Updated Successfully!");
    } catch (error) {
      alert("❌ Failed to update KYC status", error);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="w-full p-4 md:p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Retailer Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Verify and manage retailers
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by email or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 border rounded-lg w-full md:w-1/3 mb-4"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["All", "APPROVED", "PENDING", "REJECTED", "BLANK"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-1.5 rounded-full text-sm ${filter === item
              ? "bg-blue-600 text-white"
              : "bg-white border"
              }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="w-full text-sm min-w-[800px] border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left w-14">S.No</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">KYC</th>
              <th className="p-3 text-left">Referral</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="p-5 text-center text-gray-500">No retailers found</td>
              </tr>
            )}
            {paginatedRetailers.map((r, idx) => (
              <tr key={r._id} className="border-t border-gray-200 hover:bg-blue-50">
                <td className="p-3 text-gray-500 font-medium">
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className="p-3">{r.name || "—"}</td>
                <td className="p-3">{r.email || "—"}</td>
                <td className="p-3">{r.phone || "—"}</td>
                <td className="p-3">
                  <StatusBadge status={r.kyc} />
                </td>
                <td className="p-3">
                  {r.referredBy ? (
                    r.referralBonusCredited ? (
                      <span className="text-green-600 text-xs font-medium">Credited</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">Not credited</span>
                    )
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => {
                      setSelectedRetailer(r);
                      setUpdatedStatus(r.kyc);
                    }}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 px-4 py-3 border-t flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
            <span className="font-semibold">{filtered.length}</span> retailers
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return <button key={p} onClick={() => goToPage(p)} className={`px-3.5 py-1.5 rounded-md text-sm font-medium ${currentPage === p ? "bg-blue-600 text-white" : "bg-white border hover:bg-gray-100"}`}>{p}</button>;
                }
                if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="px-1 text-gray-400">...</span>;
                return null;
              })}
            </div>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}

      {selectedRetailer && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-3">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">

            {/* Header */}
            <div className="flex justify-between px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-lg">Retailer Details</h2>
              <button
                onClick={() => setSelectedRetailer(null)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

              <Info label="Name" value={selectedRetailer.name} />
              <Info label="Email" value={selectedRetailer.email} />
              <Info label="Phone" value={selectedRetailer.phone} />

              {/* Referral: show referrer and whether wallet was credited */}
              <div className="border p-3 rounded bg-white">
                <b>Referral:</b>{" "}
                {selectedRetailer.referredBy
                  ? `${selectedRetailer.referredBy.name || "—"} (${selectedRetailer.referredBy.referralCode || "—"})`
                  : "Not referred"}
                {selectedRetailer.referredBy && (
                  <span className="ml-2 text-sm">
                    {selectedRetailer.referralBonusCredited ? (
                      <span className="text-green-600">• Credited to referrer wallet</span>
                    ) : (
                      <span className="text-amber-600">• Not yet credited</span>
                    )}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-800 pt-2">Retailer documents</h3>
              <Info label="Drug License No" value={selectedRetailer.drugLicenseNumber} />
              <DocumentRow label="Drug License Doc" number="" file={fileUrl(selectedRetailer.drugLicenseDoc)} />

              <Info label="GST No" value={selectedRetailer.gstNumber} />
              <DocumentRow label="GST Doc" number="" file={fileUrl(selectedRetailer.gstDoc)} />

              <DocumentRow label="Shop Photo" number="" file={fileUrl(selectedRetailer.shopImage)} />

              <h3 className="font-semibold text-gray-800 pt-2">Bank details</h3>
              <Info label="Bank Name" value={selectedRetailer.bankName} />
              <Info label="Account Holder" value={selectedRetailer.accountHolderName} />
              <Info label="Account Number" value={selectedRetailer.accountNumber} />
              <Info label="IFSC Code" value={selectedRetailer.ifscCode} />
              <DocumentRow label="Cancel Cheque / Passbook" number="" file={fileUrl(selectedRetailer.cancelChequeDoc)} />

              {(selectedRetailer.aadharNumber || selectedRetailer.aadharDoc || selectedRetailer.panNumber || selectedRetailer.panDoc) && (
                <>
                  <h3 className="font-semibold text-gray-800 pt-2">Identity (if submitted)</h3>
                  <DocumentRow label="Aadhar No" number={selectedRetailer.aadharNumber} file={fileUrl(selectedRetailer.aadharDoc)} />
                  <DocumentRow label="PAN No" number={selectedRetailer.panNumber} file={fileUrl(selectedRetailer.panDoc)} />
                </>
              )}

              {/* Status */}
              <select
                value={updatedStatus}
                onChange={(e) => setUpdatedStatus(e.target.value)}
                className="border w-full px-3 py-2 rounded"
              >
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="BLANK">BLANK</option>
              </select>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              {selectedRetailer.kyc === "APPROVED" &&
                selectedRetailer.referredBy &&
                !selectedRetailer.referralBonusCredited && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setReprocessing(true);
                        await reprocessReferralReward(selectedRetailer._id);
                        const updatedUsers = users.map((u) =>
                          u._id === selectedRetailer._id
                            ? { ...u, referralBonusCredited: true }
                            : u
                        );
                        setUsers(updatedUsers);
                        setSelectedRetailer((prev) => (prev ? { ...prev, referralBonusCredited: true } : null));
                        alert("Referral reward credited. MR wallet updated.");
                      } catch {
                        alert("Failed to credit referrer. Check console.");
                      } finally {
                        setReprocessing(false);
                      }
                    }}
                    disabled={reprocessing}
                    className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
                  >
                    {reprocessing ? "..." : "Credit referrer (MR)"}
                  </button>
                )}
              <button
                onClick={() => setSelectedRetailer(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function StatusBadge({ status }) {
  const map = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
    BLANK: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status || "—"}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="border p-2 rounded bg-white">
      <b>{label}:</b> {value || "N/A"}
    </div>
  );
}

function DocumentRow({ label, number, file }) {
  return (
    <div className="border p-3 rounded bg-white flex flex-wrap justify-between items-center gap-2">
      <span>
        <b>{label}:</b> {number || "—"}
      </span>
      {file ? (
        <span className="flex items-center gap-3">
          <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium">
            View
          </a>
          <a href={file} download target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium">
            Download
          </a>
        </span>
      ) : (
        <span className="text-gray-400 text-sm">Not uploaded</span>
      )}
    </div>
  );
}  