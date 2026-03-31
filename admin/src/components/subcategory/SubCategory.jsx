"use client";
import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useContextApi } from "../../hooks/useContextApi";
import AddSubCategory from "./AddSubCategory";

export default function SubCategory() {
    const { GetSubCategoryData, deletesubcategory } = useContextApi();
    const [subcategoryData, setSubcategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);

    const fetchSubCategories = async () => {
        try {
            const response = await GetSubCategoryData();
            setSubcategoryData(response?.data?.data || []);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this subcategory?")) {
            await deletesubcategory({ _id: id });
            fetchSubCategories();
        }
    };

    const handleAdd = () => {
        setEditingData(null);
        setDialogOpen(true);
    };

    const handleEdit = (item) => {
        setEditingData(item);
        setDialogOpen(true);
    };

    useEffect(() => {
        fetchSubCategories();
    }, []);

    return (
        <div className="h-full  w-[230%] px-2 pt-2">
            <h1 className="mb-4 text-2xl font-bold text-gray-800">Sub Category Management</h1>

            <div className="flex justify-end mb-2">
                <button
                    onClick={handleAdd}
                    className="flex items-center rounded-md bg-blue-500 text-white px-3 py-2 hover:bg-blue-700"
                >
                    <Plus className="mr-1" /> Add SubCategory
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <Table className="rounded-lg border border-gray-200 shadow-md">
                    <TableCaption>List of Subcategories</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>S.NO</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Edit</TableHead>
                            <TableHead className="text-center">Delete</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subcategoryData.map((item, index) => (
                            <TableRow key={item._id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <img src={item.image} alt="" className="h-10 w-10 rounded-md" />
                                </TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.category?.[0]?.name || "—"}</TableCell>
                                <TableCell className="text-center">
                                    <button onClick={() => handleEdit(item)} className="p-2 hover:bg-blue-100 rounded-md">
                                        <Pencil className="text-blue-600" />
                                    </button>
                                </TableCell>
                                <TableCell className="text-center">
                                    <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-red-100 rounded-md">
                                        <Trash2 className="text-red-600" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <AddSubCategory
                open={dialogOpen}
                setOpen={setDialogOpen}
                existingData={editingData}
                onSubCategorySaved={fetchSubCategories}
            />

        </div>
    );
}
