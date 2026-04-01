import React, { useEffect, useState, useMemo } from "react";
import {
    Table, TableBody, TableCaption, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { useContextApi } from "../hooks/useContextApi";
import AddCategoryField from "./AddCategoryField";
import AddCategory from "./AddCategory";

// Always use this base for category image URLs so they work regardless of VITE_BASE_URL
const IMAGE_BASE_URL = "https://api.kuremedi.com";

const getCategoryImageUrl = (item) => {
    const img = item?.image;
    if (!img) return null;
    if (typeof img === "string" && (img.startsWith("http") || img.startsWith("blob:"))) return img;
    const p = String(img).replace(/\\/g, "/").replace(/^\//, "");
    return `${IMAGE_BASE_URL}/${p}`;
};

export default function Categories() {

    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "", image: "", imageFile: null });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { GetCategoryData, updateCategoryWithFormData, DeleteCategory } = useContextApi();

    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return categories.slice(start, start + itemsPerPage);
    }, [categories, currentPage]);
    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ✅ Fetch all categories
    const fetchCategories = async () => {
        try {
            const result = await GetCategoryData();
            console.log("Fetched categories:", result);
            setCategories(result?.data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    // ✅ Load once on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // ✅ When edit button clicked
    const handleEditClick = (item) => {
        setSelectedCategory(item);
        setFormData({
            _id: item._id,
            name: item.name,
            description: item.description,
            image: item.image || "",
            imageFile: null,
        });
        setOpen(true);
    };

    // ✅ Update category
    const handleUpdateCategory = async () => {

        if (!formData.name.trim() || !formData.description.trim()) {
            alert("Please fill out all fields before updating.");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name.trim());
            fd.append("description", formData.description.trim() || "");
            if (formData.imageFile) fd.append("image", formData.imageFile);
            const res = await updateCategoryWithFormData(formData._id, fd);
            if (res?.success) {
                alert("✅ Category updated successfully!");
                await fetchCategories();
                setOpen(false);
                setSelectedCategory(null);
                setFormData({ name: "", description: "", image: "", imageFile: null });
            } else {
                console.log("⚠️ Something went wrong while updating category.");
            }
        } finally {
            setLoading(false);
        }
    };

    const HandleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        console.log("Delete category with ID:", categoryToDelete._id);
        try {
            const res = await DeleteCategory(categoryToDelete._id);
            console.log("Delete response:", res);

            if (res?.success) {
                alert("✅ Category deleted successfully!");
                await fetchCategories(); // refresh
            } else {
                alert(`❌ Failed to delete category: ${res.message}`);
            }
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("❌ Something went wrong while deleting.");
        } finally {
            setDeleteDialogOpen(false); // close dialog
            setCategoryToDelete(null);  // reset
        }
    };

    return (
        <div>
            <h1 className=" mb-4 text-2xl font-bold text-gray-800">
                Add Category
            </h1>
            <div className="w-full">

                {/* ✅ Add Category Button + Modal */}
                <AddCategory onCategoryAdded={fetchCategories} />

                <Table className="rounded-lg border border-gray-200 shadow-md">

                    <TableCaption>List of available categories.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] text-center">S.NO</TableHead>
                            <TableHead>Category Photo</TableHead>
                            <TableHead>Category Name</TableHead>
                            <TableHead className="text-center">Edit</TableHead>
                            <TableHead className="text-center">Delete</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paginatedCategories.map((item, index) => (
                            <TableRow key={item._id} className="hover:bg-gray-50">
                                <TableCell className="text-center font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                <TableCell className="flex items-center justify-center">
                                    {getCategoryImageUrl(item) ? (
                                        <img
                                            src={getCategoryImageUrl(item)}
                                            alt={item.name}
                                            className="h-12 w-12 rounded-md border object-cover"

                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-md border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
                                    )}
                                </TableCell>
                                <TableCell>{item.name}</TableCell>

                                <TableCell className="text-center">
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        className="rounded-md p-2 hover:bg-blue-100 transition"
                                    >
                                        <Pencil className="h-5 w-5 text-blue-600" />
                                    </button>
                                </TableCell>

                                <TableCell className="text-center">
                                    <button
                                        onClick={() => {
                                            setCategoryToDelete(item);  // store which one to delete
                                            setDeleteDialogOpen(true);  // open confirmation dialog
                                        }}
                                        className="rounded-md p-2 hover:bg-red-100 transition"
                                    >
                                        <Trash2 className="h-5 w-5 text-red-600" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedCategories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No categories found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50 rounded-b-lg">
                        <p className="text-sm text-gray-600">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, categories.length)} of {categories.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm font-medium px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ✅ Edit Dialog */}
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Update Category{selectedCategory ? `: ${selectedCategory.name}` : ""}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                                Modify the details and click Update.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AddCategoryField formData={formData} setFormData={setFormData} />

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUpdateCategory} disabled={loading}>
                                {loading ? "Updating..." : "Update"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>


            {/* ✅ Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-red-600">
                                {categoryToDelete?.name}
                            </span>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={HandleDeleteCategory}
                            disabled={loading}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {loading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
