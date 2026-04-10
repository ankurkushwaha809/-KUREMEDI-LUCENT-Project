import React, { useState } from "react";
import { Plus, AlertCircle } from "lucide-react"; // nice add icon
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useContextApi } from "../hooks/useContextApi";
import AddCategoryField from "./AddCategoryField";
import Categories from "./Categories";
import { getErrorMessage, logError } from "../utils/errorHandler";


export default function AddCategory({ onCategoryAdded }) {

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: "",
        imageFile: null,
    });

    const { createCategoryWithFormData } = useContextApi();

    const handleCreateCategory = async () => {
        setErrorMsg("");
        setSuccessMsg("");
        
        const name = formData.name.trim();
        const description = formData.description.trim();
        if (!name) {
            setErrorMsg("Category name is required.");
            return;
        }
        if (!description) {
            setErrorMsg("Description is required.");
            return;
        }
        try {
            setLoading(true);
            const fd = new FormData();
            fd.append("name", formData.name.trim());
            fd.append("description", formData.description.trim() || "");
            if (formData.imageFile) fd.append("image", formData.imageFile);
            const res = await createCategoryWithFormData(fd);
            if (res?.success) {
                setSuccessMsg("Category created successfully!");
                setFormData({ name: "", description: "", image: "", imageFile: null });
                setTimeout(() => {
                    if (onCategoryAdded) onCategoryAdded();
                    setIsDialogOpen(false);
                }, 1000);
            } else {
                const errorMsg = res?.message || res?.msg || "Failed to create category";
                setErrorMsg(errorMsg);
                logError("Category creation", new Error(errorMsg));
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            setErrorMsg(errorMessage);
            logError("Category creation", error);
        } finally {
            setLoading(false);
        }
    }



    return (
        <>

            {/* Top bar container */}
            <div className="flex w-full items-center justify-end rounded-t-md border-b border-gray-100 bg-gray-100 p-2">
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className='bg-blue-500 font-medium text-white hover:bg-blue-700 hover:text-white'>
                            <Plus />Add Category
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="max-w-md">

                        <AlertDialogHeader>
                            <AlertDialogTitle>Create New Category</AlertDialogTitle>

                            <AlertDialogDescription className='text-gray-600'>
                                Please provide a name and description for your new category.
                            </AlertDialogDescription>

                        </AlertDialogHeader>

                        {errorMsg && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-700 text-sm">{errorMsg}</p>
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 text-sm font-medium">{successMsg}</p>
                            </div>
                        )}

                        <AddCategoryField formData={formData} setFormData={setFormData} />

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCreateCategory} disabled={loading}>
                                {loading ? "Creating..." : "Create"}
                            </AlertDialogAction>

                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

        </>
    );
}
