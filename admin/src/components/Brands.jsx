import React, { useEffect, useState, useMemo } from "react";
import {
    Table, TableBody, TableCaption, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

import { useContextApi } from "../hooks/useContextApi";
import AddBrandField from "./AddBrandField";
import AddBrand from "./AddBrand";

const IMAGE_BASE_URL = "https://api.kuremedi.com";

const getBrandLogoUrl = (item) => {
    const logo = item?.logo || item?.image;
    if (!logo) return null;
    if (typeof logo === "string" && (logo.startsWith("http") || logo.startsWith("blob:"))) return logo;
    const p = String(logo).replace(/\\/g, "/").replace(/^\//, "");
    return `${IMAGE_BASE_URL}/${p}`;
};

export default function Brands() {
    const [open, setOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "", image: "" });
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { getBrands, updateBrandWithFormData, deleteBrand } = useContextApi();

    const totalPages = Math.ceil(brands.length / itemsPerPage);
    const paginatedBrands = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return brands.slice(start, start + itemsPerPage);
    }, [brands, currentPage]);
    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ✅ Fetch all brands
    const fetchBrands = async () => {
        try {
            const result = await getBrands();
            console.log("Fetched brands:", result);
            setBrands(result?.data || []);
        } catch (error) {
            console.error("Error fetching brands:", error);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
    }, [brands.length, totalPages, currentPage]);

    // ✅ When edit button clicked
    const handleEditClick = (item) => {
        setSelectedBrand(item);
        setFormData({
            _id: item._id,
            name: item.name,
            description: item.description,
            logo: item.logo || item.image || "",
            logoFile: null,
        });
        setOpen(true);
    };

    // ✅ Update brand
    const handleUpdateBrand = async () => {
        if (!formData.name.trim()) {
            alert("Please fill out the brand name.");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name.trim());
            fd.append("description", formData.description?.trim() || "");
            if (formData.logoFile) fd.append("logo", formData.logoFile);
            const res = await updateBrandWithFormData(formData._id, fd);
            if (res?.success) {
                alert("✅ Brand updated successfully!");
                await fetchBrands();
                setOpen(false);
                setSelectedBrand(null);
                setFormData({ name: "", description: "", logo: "", logoFile: null });
            }
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Delete brand
    const HandleDeleteBrand = async () => {
        if (!brandToDelete) return;

        setLoading(true);
        try {
            const res = await deleteBrand(brandToDelete._id);
            if (res?.success) {
                alert("✅ Brand deleted successfully!");
                await fetchBrands();
            } else {
                alert(`❌ Failed: ${res.message}`);
            }
        } catch (err) {
            console.error("Error deleting brand:", err);
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setBrandToDelete(null);
        }
    };

    return (
        <div className="w-full">
            <h1 className="mb-4 text-2xl font-bold text-gray-800">Brands Management</h1>

            {/* ✅ Add Brand Button + Modal */}
            <AddBrand onBrandAdded={fetchBrands} />

            <Table className="rounded-lg border border-gray-200 shadow-md">
                <TableCaption>List of available brands.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px] text-center">S.NO</TableHead>
                        <TableHead>Brand Logo</TableHead>
                        <TableHead>Brand Name</TableHead>
                        <TableHead className="text-center">Edit</TableHead>
                        <TableHead className="text-center">Delete</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {paginatedBrands.map((item, index) => (
                        <TableRow key={item._id} className="hover:bg-gray-50">
                            <TableCell className="text-center font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell className="flex items-center justify-center">
                                {getBrandLogoUrl(item) ? (
                                    <img
                                        src={getBrandLogoUrl(item)}
                                        alt={item.name}
                                        className="h-12 w-12 rounded-md border object-cover"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/48?text=?"; }}
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-md border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
                                )}
                            </TableCell>
                            <TableCell className="font-semibold">{item.name}</TableCell>
                            <TableCell className="text-center">
                                <button onClick={() => handleEditClick(item)} className="rounded-md p-2 hover:bg-blue-100 transition">
                                    <Pencil className="h-5 w-5 text-blue-600" />
                                </button>
                            </TableCell>
                            <TableCell className="text-center">
                                <button
                                    onClick={() => {
                                        setBrandToDelete(item);
                                        setDeleteDialogOpen(true);
                                    }}
                                    className="rounded-md p-2 hover:bg-red-100 transition"
                                >
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {paginatedBrands.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No brands found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50 rounded-b-lg">
                    <p className="text-sm text-gray-600">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, brands.length)} of {brands.length}
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
                        <AlertDialogTitle>Update Brand{selectedBrand ? `: ${selectedBrand.name}` : ""}</AlertDialogTitle>
                        <AlertDialogDescription>Modify brand details and click Update.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AddBrandField formData={formData} setFormData={setFormData} />
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateBrand} disabled={loading}>
                            {loading ? "Updating..." : "Update"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ✅ Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Brand</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-red-600">{brandToDelete?.name}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={HandleDeleteBrand} disabled={loading} className="bg-red-600 text-white hover:bg-red-700">
                            {loading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}