"use client";
import React, { useEffect, useState } from "react";
import { useContextApi } from "../hooks/useContextApi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function AddBlog({ editingBlog, onSubmitSuccess }) {
    const { addBlog, updateBlog, uploadImage, fetchblogCategories } = useContextApi();

    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        title: "",
        content: "",
        excerpt: "",
        image: "",
        category: "",
        author: "",
        tags: "",
        status: "draft",
    });

    const FILE_URL = import.meta.env.VITE_FILE_URL;

    // 🟩 Load Categories
    useEffect(() => {
        (async () => {
            const res = await fetchblogCategories();
            setCategories(res?.data || []);
        })();
    }, []);

    // 🟨 If editing, prefill form
    useEffect(() => {
        if (editingBlog) {
            setForm({
                title: editingBlog.title || "",
                content: editingBlog.content || "",
                excerpt: editingBlog.excerpt || "",
                image: editingBlog.image || "",
                category: editingBlog.category?._id || editingBlog.category || "",
                author: editingBlog.author || "",
                tags: editingBlog.tags?.join(", ") || "",
                status: editingBlog.status || "draft",
            });
        }
    }, [editingBlog]);

    // 🟪 Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const path = await uploadImage(file);
        const filePath = path?.data?.filePath || path || "";
        setForm({ ...form, image: filePath });
    };

    // 🟢 Submit Form (Add or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            tags: form.tags
                ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                : [],
        };
        try {
            if (editingBlog) await updateBlog(editingBlog._id, payload);
            else await addBlog(payload);

            onSubmitSuccess?.();
            resetForm();
        } catch (err) {
            console.error("Error submitting blog:", err);
        }
    };

    const resetForm = () => {
        setForm({
            title: "",
            content: "",
            excerpt: "",
            image: "",
            category: "",
            author: "",
            tags: "",
            status: "draft",
        });
    };

    // 🧠 Quill Options
    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image", "video"],
            ["clean"],
        ],
    };

    return (
        <div className=" max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
                {editingBlog ? "Update Blog" : "Add New Blog"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <input
                    type="text"
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border rounded p-2"
                    required
                />

                {/* Content */}
                <ReactQuill
                    theme="snow"
                    value={form.content}
                    onChange={(value) => setForm({ ...form, content: value })}
                    modules={quillModules}
                    className="h-60 mb-10"
                    placeholder="Write your blog content..."
                />

                {/* Excerpt */}
                <textarea
                    placeholder="Excerpt (short summary)"
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    className="w-full border rounded p-2 h-20"
                />

                {/* Category */}
                <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded p-2"
                >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                {/* Author */}
                <input
                    type="text"
                    placeholder="Author"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full border rounded p-2"
                />

                {/* Tags */}
                <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full border rounded p-2"
                />

                {/* Status */}
                <div className="flex items-center gap-4">
                    <label className="flex gap-2 items-center text-sm">
                        <input
                            type="radio"
                            name="status"
                            value="published"
                            checked={form.status === "published"}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        />
                        Published
                    </label>
                    <label className="flex gap-2 items-center text-sm">
                        <input
                            type="radio"
                            name="status"
                            value="draft"
                            checked={form.status === "draft"}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        />
                        Draft
                    </label>
                </div>

                {/* Image Upload */}
                <div className="border rounded-lg p-3">
                    <label className="block text-sm mb-2">Featured Image</label>
                    {form.image ? (
                        <div className="relative">
                            <img
                                src={
                                    form.image.startsWith("http")
                                        ? form.image
                                        : `${FILE_URL}${form.image}`
                                }
                                alt="preview"
                                className="w-full h-48 object-cover rounded"
                            />
                            <button
                                type="button"
                                className="absolute top-2 right-2 bg-white border rounded-full px-2"
                                onClick={() => setForm({ ...form, image: "" })}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <label className="flex justify-center items-center border border-dashed rounded-lg h-32 cursor-pointer text-gray-500 hover:bg-gray-50">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            Upload Image
                        </label>
                    )}
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {editingBlog ? "Update" : "Publish"}
                    </button>
                </div>
            </form>
        </div>
    );
}
