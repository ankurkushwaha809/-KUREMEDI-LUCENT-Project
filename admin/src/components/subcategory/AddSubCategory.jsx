"use client";
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useContextApi } from "../../hooks/useContextApi";

export default function AddSubCategory({
    open,
    setOpen,
    existingData,
    onSubCategorySaved,
}) {
    const { createsubcategory, updatesubcategory, GetCategoryData, uploadImage } =
        useContextApi();

    const BASE_URL = import.meta.env.VITE_FILE_URL; // ✅ adjust if deployed

    const [formData, setFormData] = useState({
        name: "",
        image: "",
        category: "",
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Load parent categories for dropdown
    useEffect(() => {
        (async () => {
            const res = await GetCategoryData();
            setCategories(res?.data?.data || []);
        })();
    }, []);

    // ✅ Prefill when editing
    useEffect(() => {
        if (existingData) {
            setFormData({
                name: existingData.name || "",
                image: existingData.image || "",
                category: existingData.category?.[0]?._id || "",
            });
        } else {
            setFormData({ name: "", image: "", category: "" });
        }
    }, [existingData, open]);

    // ✅ Handle image upload
    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const response = await uploadImage(file);

            const imageUrl = response?.data?.filePath
                ? `${BASE_URL}${response.data.filePath}`
                : response?.data?.secure_url || response?.data?.url;

            setFormData((prev) => ({ ...prev, image: imageUrl }));
            console.log("✅ Image uploaded:", imageUrl);
        } catch (error) {
            console.error("❌ Upload error:", error);
        }
    };

    // ✅ Handle add/update submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };

            let res;
            if (existingData?._id) {
                res = await updatesubcategory({ _id: existingData._id, ...payload });
            } else {
                res = await createsubcategory(payload);
            }

            if (res.data.success) { // ✅ fixed
                alert(existingData ? "✅ Updated successfully!" : "✅ Added successfully!");
                setOpen(false);
                onSubCategorySaved(); // ✅ refresh list or close dialog
            } else {
                alert("❌ Failed to save data");
            }
        } catch (error) {
            console.error("Error saving subcategory:", error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {existingData ? "Edit SubCategory" : "Add SubCategory"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ✅ Name Field */}
                    <div>
                        <label className="block font-medium mb-1">Name</label>
                        <Input
                            placeholder="Enter subcategory name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* ✅ Image Upload */}
                    <div>
                        <label className="block font-medium mb-1">Image</label>
                        <Input type="file" accept="image/*" onChange={handleUploadImage} />
                        {formData.image && (
                            <img
                                src={formData.image}
                                alt="Preview"
                                className="mt-2 h-20 w-20 rounded-md border object-cover"
                            />
                        )}
                    </div>

                    {/* ✅ Parent Category */}
                    <div>
                        <label className="block font-medium mb-1">Parent Category</label>
                        <select
                            className="w-full rounded-md border p-2"
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                            required
                        >
                            <option value="">Select a Category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ✅ Buttons */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-md border border-gray-300 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading
                                ? "Saving..."
                                : existingData
                                    ? "Update SubCategory"
                                    : "Add SubCategory"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
