"use client";
import React, { useEffect, useState } from "react";
import { useContextApi } from "../hooks/useContextApi";
import AddBlog from "./CreateNew";

export default function BlogList() {
    const { fetchBlogs, deleteBlog, fetchblogCategories } = useContextApi();

    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        status: "",
    });
    const [page, setPage] = useState(1);
    const [editingBlog, setEditingBlog] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const limit = 5;

    // 🟩 Load Blogs
    const loadBlogs = async () => {
        const res = await fetchBlogs();
        setBlogs(res?.data || []);
    };

    // 🟨 Load Categories
    useEffect(() => {
        (async () => {
            const res = await fetchblogCategories();
            setCategories(res?.data || []);
        })();
        loadBlogs();
    }, []);

    // 🧩 Filter + Search
    const filtered = blogs
        .filter((b) =>
            b.title.toLowerCase().includes(filters.search.toLowerCase())
        )
        .filter((b) =>
            filters.category ? b.category?._id === filters.category : true
        )
        .filter((b) =>
            filters.status ? b.status === filters.status : true
        );

    // 🧮 Pagination
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    const totalPages = Math.ceil(filtered.length / limit);

    // 🗑️ Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this blog?")) return;
        await deleteBlog(id);
        loadBlogs();
    };

    // ✏️ Edit
    const handleEdit = (blog) => {
        setEditingBlog(blog);
        setShowModal(true);
    };

    // ➕ Add New
    const handleAddNew = () => {
        setEditingBlog(null);
        setShowModal(true);
    };

    // ✅ After Add/Update
    const handleSuccess = () => {
        setShowModal(false);
        setEditingBlog(null);
        loadBlogs();
    };

    return (
        <div className="p-6 w-[100%]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Blogs</h2>
                <button
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Add New Blog
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <input
                    type="text"
                    placeholder="Search title or author..."
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                    className="border rounded p-2 flex-1 min-w-[180px]"
                />
                <select
                    value={filters.category}
                    onChange={(e) =>
                        setFilters({ ...filters, category: e.target.value })
                    }
                    className="border rounded p-2"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.status}
                    onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                    }
                    className="border rounded p-2"
                >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-100 text-sm text-gray-700">
                        <tr>
                            <th className="p-3 text-left">Title</th>
                            <th className="p-3 text-left">Category</th>
                            <th className="p-3 text-left">Author</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-gray-500">
                                    No blogs found.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((b) => (
                                <tr
                                    key={b._id}
                                    className="border-t hover:bg-gray-50 transition"
                                >
                                    <td className="p-3">{b.title}</td>
                                    <td className="p-3">{b.category?.name || "-"}</td>
                                    <td className="p-3">{b.author || "Admin"}</td>
                                    <td className="p-3 capitalize">{b.status}</td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(b)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(b._id)}
                                            className="text-red-600 hover:underline text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`px-3 py-1 border rounded ${n === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                                }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            )}

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-50/20 bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
                        >
                            ✕
                        </button>
                        <AddBlog editingBlog={editingBlog} onSubmitSuccess={handleSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
}
