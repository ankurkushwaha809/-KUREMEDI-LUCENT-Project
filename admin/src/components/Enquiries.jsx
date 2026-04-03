"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useContextApi } from "../hooks/useContextApi";

export default function Enquiries() {
    const adminUser = JSON.parse(localStorage.getItem("adminUser"));
    const loggedInSalesName = adminUser?.name;  
    const loggedInRole = adminUser?.role; 
    // console.log("name", loggedInSalesName)
    // console.log("admin", loggedInRole)

    const { enquiries,   addEnquiry, updateEnquiry, deleteEnquiry, fetchEnquiries } = useContextApi();

    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [filterSalesperson, setFilterSalesperson] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSource, setFilterSource] = useState("");
    const [filterTime, setFilterTime] = useState("all");
    const [form, setForm] = useState({
        name: "",
        phone: "",
        status: "Pending",
        assignedTo: "",
        lastMessage: "",
        source: "Other",
    });
  
    const [editId, setEditId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const salesPersons = ["Priyanka", "Anjali", "Priya", "Manju", "Nidhika"];
    const sources = ["Google", "Meta", "Indiamart", "JustDial", "Organic", "Referral", "Other"];

    useEffect(() => {
        fetchEnquiries();
    }, []);

    // ✅ CRUD Handlers
    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     if (editId) await updateEnquiry(editId, form);
    //     else await addEnquiry(form);

    //     resetForm();
    //     setShowModal(false);
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalData = {
            ...form,            // keep selected salesperson
            assignedTo: form.assignedTo
        };

        if (editId) await updateEnquiry(editId, finalData);
        else await addEnquiry(finalData);

        resetForm();
        setShowModal(false);
    };



    const handleEdit = (item) => {
        setForm(item);
        setEditId(item._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this lead?");
        if (!confirmDelete) return; // ❌ user canceled
        await deleteEnquiry(id);    // ✅ confirmed, proceed with delete
    };


    const handleStatusChange = async (item, newStatus) => {
        await updateEnquiry(item._id, { ...item, status: newStatus });
    };

    const resetForm = () => {
        setForm({
            name: "",
            phone: "",
            status: "Pending",
            assignedTo: "",
            lastMessage: "",
            source: "Other",
        });
        setEditId(null);
    };

    // ✅ Time Filter Logic
    const isWithinTimeRange = (createdAt) => {
        const now = new Date();
        const date = new Date(createdAt);
        if (filterTime === "day") return date.toDateString() === now.toDateString();
        if (filterTime === "week") {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            return date >= startOfWeek;
        }
        if (filterTime === "month")
            return (
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear()
            );
        return true;
    };
    const filtered = useMemo(() => {
        return enquiries

            // 🔥 Role-based filter
            .filter(item => {
                if (loggedInRole === "ADMIN" || loggedInRole==="SUPERADMIN") return true; // Admin sees all
                return item.assignedTo === loggedInSalesName; // User sees only their enquiries
            })

            // 🔥 Existing filters
            .filter(
                (item) =>
                    item.name?.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone?.toLowerCase().includes(search.toLowerCase()) ||
                    item.assignedTo?.toLowerCase().includes(search.toLowerCase()) ||
                    item.status?.toLowerCase().includes(search.toLowerCase()) ||
                    item.lastMessage?.toLowerCase().includes(search.toLowerCase())
            )
            .filter((item) => (filterSalesperson ? item.assignedTo === filterSalesperson : true))
            .filter((item) => (filterStatus ? item.status === filterStatus : true))
            .filter((item) => (filterSource ? item.source === filterSource : true))
            .filter((item) => isWithinTimeRange(item.createdAt));
    }, [
        enquiries,
        search,
        filterSalesperson,
        filterStatus,
        filterSource,
        filterTime,
        loggedInRole,
        loggedInSalesName
    ]);

    // ✅ Filtering Logic
    // const filtered = useMemo(() => {
    //     return enquiries
    //         .filter(
    //             (item) =>
    //                 item.name?.toLowerCase().includes(search.toLowerCase()) ||
    //                 item.phone?.toLowerCase().includes(search.toLowerCase()) ||
    //                 item.assignedTo?.toLowerCase().includes(search.toLowerCase()) ||
    //                 item.status?.toLowerCase().includes(search.toLowerCase()) ||
    //                 item.lastMessage?.toLowerCase().includes(search.toLowerCase())
    //         )
    //         .filter((item) => (filterSalesperson ? item.assignedTo === filterSalesperson : true))
    //         .filter((item) => (filterStatus ? item.status === filterStatus : true))
    //         .filter((item) => (filterSource ? item.source === filterSource : true))
    //         .filter((item) => isWithinTimeRange(item.createdAt));
    // }, [enquiries, search, filterSalesperson, filterStatus, filterSource, filterTime]);

    // ✅ Pagination Logic
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="w-[125%] p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Enquiries</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    + Add Enquiry
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name, phone, or message..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <select
                    value={filterSalesperson}
                    onChange={(e) => setFilterSalesperson(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Salespersons</option>
                    {salesPersons.map((person) => (
                        <option key={person} value={person}>
                            {person}
                        </option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                </select>

                <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Sources</option>
                    {sources.map((src) => (
                        <option key={src} value={src}>
                            {src}
                        </option>
                    ))}
                </select>

                <select
                    value={filterTime}
                    onChange={(e) => setFilterTime(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">All Time</option>
                    <option value="day">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="w-[50px] px-1 py-2 text-left text-sm font-semibold text-gray-600">#</th>
                            <th className="px-1 py-2 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-1 py-2 text-left text-sm font-semibold text-gray-600">Phone</th>
                            <th className="px-1 py-2 text-left text-sm font-semibold text-gray-600">Source</th>
                            <th className="px-1 py-2 text-left text-sm font-semibold text-gray-600">Assigned To</th>
                            <th className="px-1 py-2 text-left text-sm font-semibold text-gray-600">Last Message</th>
                            <th className="px-1 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-1 py-2 text-center text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginated.length > 0 ? (
                            paginated.map((item, index) => (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-700">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </td>
                                    <td className="px-1 py-2 text-gray-700">{item.name}</td>
                                    <td className="px-1 py-2 text-gray-700">{item.phone}</td>
                                    <td className="px-1 py-2 text-gray-700">{item.source}</td>
                                    <td className="px-1 py-2 text-gray-700">{item.assignedTo || "-"}</td>
                                    <td className="px-1 py-2 text-gray-700 italic">{item.lastMessage || "—"}</td>
                                    <td className="px-1 py-2">
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusChange(item, e.target.value)}
                                            className={`px-2 py-1 border rounded-md text-sm ${item.status === "Pending"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : item.status === "Resolved"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Resolved">Resolved</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </td>
                                    <td className="px-1 py-2 text-center">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-blue-600 hover:underline mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-gray-500 italic">
                                    No enquiries found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded-md border ${currentPage === i + 1
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">
                            {editId ? "Edit Enquiry" : "Add Enquiry"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    required
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    placeholder="Enter 10-digit phone number"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Lead Source */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                                <select
                                    value={form.source}
                                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {sources.map((src) => (
                                        <option key={src} value={src}>
                                            {src}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Salesperson */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign to Salesperson
                                </label>
                                <select
                                    value={form.assignedTo}
                                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select Salesperson</option>
                                    {salesPersons.map((person) => (
                                        <option key={person} value={person}>
                                            {person}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Last Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Customer Message
                                </label>
                                <textarea
                                    rows="2"
                                    value={form.lastMessage}
                                    onChange={(e) => setForm({ ...form, lastMessage: e.target.value })}
                                    placeholder="Type what customer said last time..."
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editId ? "Update" : "Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
