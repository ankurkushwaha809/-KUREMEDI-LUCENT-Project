"use client";
import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useContextApi } from "@/hooks/useContextApi";
import toast from "react-hot-toast";
import { X, ArrowUp, ArrowDown } from "lucide-react";

export default function ProductModal({ open, onClose, product, onSubmit }) {
    const { uploadImage, GetCategoryData, GetSubCategoryData } = useContextApi();

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: [],
        category: [],
        subCategory: [],
        stock: "",
        price: [""],
        size: [""],
        discount: "",
        features: [""],
    });

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                image: product.image || [],
                category: product.category || [],
                subCategory: product.subCategory || [],
                price: product.price?.length ? product.price : [""],
                size: product.size?.length ? product.size : [""],
                features: product.features?.length ? product.features : [""],
            });
        } else {
            setFormData({
                name: "",
                description: "",
                image: [],
                category: [],
                subCategory: [],
                stock: "",
                price: [""],
                size: [""],
                discount: "",
                features: [""],
            });
        }
    }, [product]);

    useEffect(() => {
        (async () => {
            try {
                const catRes = await GetCategoryData();
                const subRes = await GetSubCategoryData();
                setCategories(catRes?.data?.data || []);
                setSubCategories(subRes?.data?.data || []);
            } catch (err) {
                console.error("Error fetching category data:", err);
            }
        })();
    }, []);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleCheckboxChange = (key, value) => {
        setFormData((prev) => {
            const selected = prev[key];
            if (selected.includes(value)) {
                return { ...prev, [key]: selected.filter((v) => v !== value) };
            } else {
                return { ...prev, [key]: [...selected, value] };
            }
        });
    };

    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await uploadImage(file);
            const imageUrl =
                res?.data?.filePath
                    ? `${import.meta.env.VITE_FILE_URL}${res.data.filePath}`
                    : res?.data?.secure_url || res?.data?.url;
            setFormData((prev) => ({ ...prev, image: [...prev.image, imageUrl] }));
            toast.success("Image uploaded successfully!");
        } catch (err) {
            console.error("Image upload failed:", err);
            toast.error("Image upload failed.");
        }
    };

    const handleRemoveImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            image: prev.image.filter((_, i) => i !== index),
        }));
        toast.success("Image removed!");
    };

    const moveImage = (index, direction) => {
        const updated = [...formData.image];
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= updated.length) return;
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setFormData((prev) => ({ ...prev, image: updated }));
    };

    const handleAddField = (key) => {
        setFormData((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
    };

    const handleRemoveField = (key, index) => {
        const updated = [...formData[key]];
        updated.splice(index, 1);
        setFormData({ ...formData, [key]: updated });
    };

    const handleArrayChange = (key, index, value) => {
        const updated = [...formData[key]];
        updated[index] = value;
        setFormData({ ...formData, [key]: updated });
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) return toast.error("Product name is required!");
        if (formData.price.some((p) => !p))
            return toast.error("Please enter all prices!");
        onSubmit(formData);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-h-[95vh] overflow-hidden w-[1000px] max-w-[90vw] rounded-xl shadow-xl"
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-center">
                        {product ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[80vh] px-4 pb-6">
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        {/* LEFT SIDE */}
                        <div className="space-y-4">
                            <div>
                                <Label>Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <textarea
                                    className="w-full border rounded p-2 resize-none"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                />
                            </div>

                            {/* Category checkboxes */}
                            <div>
                                <Label>Categories</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2 border rounded p-3 max-h-48 overflow-y-auto bg-gray-50">
                                    {categories.map((cat) => (
                                        <label key={cat._id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.category.includes(cat._id)}
                                                onChange={() => handleCheckboxChange("category", cat._id)}
                                            />
                                            {cat.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Subcategory checkboxes */}
                            <div>
                                <Label>Subcategories</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2 border rounded p-3 max-h-48 overflow-y-auto bg-gray-50">
                                    {subCategories.map((sub) => (
                                        <label key={sub._id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.subCategory.includes(sub._id)}
                                                onChange={() =>
                                                    handleCheckboxChange("subCategory", sub._id)
                                                }
                                            />
                                            {sub.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <Label>Images (Order matters)</Label>
                                <Input type="file" accept="image/*" onChange={handleUploadImage} />
                                <div className="mt-3 grid grid-cols-5 gap-3">
                                    {formData.image.map((img, i) => (
                                        <div
                                            key={i}
                                            className="relative border rounded-lg overflow-hidden group"
                                        >
                                            <img src={img} alt="preview" className="h-24 w-full object-cover" />
                                            <div className="absolute top-1 right-1 flex gap-1">
                                                <button
                                                    onClick={() => moveImage(i, "up")}
                                                    className="bg-blue-500 text-white p-1 rounded-full"
                                                >
                                                    <ArrowUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => moveImage(i, "down")}
                                                    className="bg-blue-500 text-white p-1 rounded-full"
                                                >
                                                    <ArrowDown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveImage(i)}
                                                    className="bg-red-500 text-white p-1 rounded-full"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {i === 0 && (
                                                <span className="absolute bottom-1 left-1 bg-black text-white text-xs px-2 py-0.5 rounded">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="space-y-4">
                            <div>
                                <Label>Stock</Label>
                                <Input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => handleChange("stock", e.target.value)}
                                    placeholder="Enter stock quantity"
                                />
                            </div>

                            {/* Sizes */}
                            <div>
                                <Label>Sizes</Label>
                                {formData.size.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <Input
                                            placeholder={`Size ${i + 1}`}
                                            value={s}
                                            onChange={(e) => handleArrayChange("size", i, e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleRemoveField("size", i)}
                                            className="bg-red-500 hover:bg-red-600"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    onClick={() => handleAddField("size")}
                                    className="bg-green-500 hover:bg-green-600 w-full"
                                >
                                    Add Size
                                </Button>
                            </div>

                            {/* Prices */}
                            <div>
                                <Label>Prices</Label>
                                {formData.price.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <Input
                                            placeholder={`Price ${i + 1}`}
                                            value={p}
                                            onChange={(e) => handleArrayChange("price", i, e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleRemoveField("price", i)}
                                            className="bg-red-500 hover:bg-red-600"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    onClick={() => handleAddField("price")}
                                    className="bg-green-500 hover:bg-green-600 w-full"
                                >
                                    Add Price
                                </Button>
                            </div>

                            <div>
                                <Label>Discount (%)</Label>
                                <Input
                                    type="number"
                                    placeholder="Enter discount %"
                                    value={formData.discount}
                                    onChange={(e) => handleChange("discount", e.target.value)}
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <Label>Features</Label>
                                {formData.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <Input
                                            placeholder={`Feature ${i + 1}`}
                                            value={f}
                                            onChange={(e) => handleArrayChange("features", i, e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleRemoveField("features", i)}
                                            className="bg-red-500 hover:bg-red-600"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    onClick={() => handleAddField("features")}
                                    className="bg-green-500 hover:bg-green-600 w-full"
                                >
                                    Add Feature
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Button
                            onClick={handleSubmit}
                            className="w-[40%] text-lg py-2 rounded-md font-medium"
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
