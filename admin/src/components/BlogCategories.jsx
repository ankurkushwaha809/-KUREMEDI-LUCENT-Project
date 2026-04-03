"use client";
import React, { useEffect, useState } from "react";
import { useContextApi } from "../hooks/useContextApi";

export default function BlogCategories() {
    const {
        fetchblogCategories,
        addblogCategory,
        updateblogCategory,
        deleteblogCategory,
        uploadImage,
    } = useContextApi();

    // ✅ Get file base URL for images
    const FILE_URL = import.meta.env.VITE_FILE_URL;

    const [form, setForm] = useState({ name: "", description: "", image: "" });
    const [blogcategories, setBlogCategories] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState(null);
    const [loading, setLoading] = useState(false);

    // ✅ Fetch categories from API
    const loadCategories = async () => {
        try {
            const res = await fetchblogCategories();
            setBlogCategories(res?.data || res || []);
        } catch (err) {
            console.error("Error fetching blog categories:", err);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []); // only once on mount

    // ✅ Add category
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addblogCategory(form);
            setForm({ name: "", description: "", image: "" });
            await loadCategories();
        } catch (err) {
            console.error("Error adding category:", err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle image upload (create)
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const imageUrl = await uploadImage(file);
            setForm({ ...form, image: imageUrl });
        } catch (err) {
            console.error("Image upload failed:", err);
        }
    };

    // ✅ Open modal to edit
    const openEditModal = (cat) => {
        setEditData(cat);
        setOpenEdit(true);
    };

    // ✅ Update existing category
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateblogCategory(editData._id, editData);
            setOpenEdit(false);
            setEditData(null);
            await loadCategories();
        } catch (err) {
            console.error("Error updating category:", err);
        }
    };

    // ✅ Delete category (with confirm)
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            await deleteblogCategory(id);
            await loadCategories();
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">📝 Blog Categories</h1>

            {/* 🟩 Add Category Form */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 mb-6 bg-gray-100 p-4 rounded-lg shadow"
            >
                <input
                    type="text"
                    placeholder="Category Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border p-2 rounded"
                    required
                />

                {/* Image upload */}
                <input type="file" onChange={handleImageUpload} className="border p-2 rounded" />

                {form.image && (
                    <img
                        src={form.image.startsWith("http") ? form.image : `${FILE_URL}/${form.image}`}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded"
                    />
                )}

                <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="border p-2 rounded"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className={`${loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
                        } text-white py-2 rounded transition`}
                >
                    {loading ? "Saving..." : "Add Category"}
                </button>
            </form>

            {/* 🟦 Category List */}
            <div className="grid gap-4">
                {blogcategories && blogcategories.length > 0 ? (
                    blogcategories.map((cat) => (
                        <div
                            key={cat._id}
                            className="flex justify-between items-center bg-white border p-3 rounded shadow-sm"
                        >
                            <div className="flex gap-3 items-center">
                                {cat.image && (
                                    <img
                                        src={cat.image.startsWith("http") ? cat.image : `${FILE_URL}/${cat.image}`}
                                        alt={cat.name}
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                )}
                                <div>
                                    <h2 className="font-medium">{cat.name}</h2>
                                    <p className="text-sm text-gray-500">{cat.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => openEditModal(cat)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No blog categories found.</p>
                )}
            </div>

            {/* 🧩 Edit Category Popup */}
            {openEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg relative">
                        <button
                            onClick={() => setOpenEdit(false)}
                            className="absolute right-4 top-3 text-gray-500 hover:text-gray-700 text-xl"
                        >
                            ✖
                        </button>
                        <h2 className="text-lg font-semibold mb-4">Edit Category</h2>

                        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={editData?.name || ""}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="border p-2 rounded"
                                required
                            />
                            <textarea
                                value={editData?.description || ""}
                                onChange={(e) =>
                                    setEditData({ ...editData, description: e.target.value })
                                }
                                className="border p-2 rounded"
                            />
                            <input
                                type="file"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const url = await uploadImage(file);
                                    setEditData({ ...editData, image: url });
                                }}
                                className="border p-2 rounded"
                            />
                            {editData?.image && (
                                <img
                                    src={
                                        editData.image.startsWith("http")
                                            ? editData.image
                                            : `${FILE_URL}/${editData.image}`
                                    }
                                    alt="preview"
                                    className="w-24 h-24 rounded object-cover"
                                />
                            )}
                            <button
                                type="submit"
                                className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                            >
                                Update Category
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
