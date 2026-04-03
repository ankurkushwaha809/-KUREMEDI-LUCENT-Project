import React, { useState } from "react";
import { Plus } from "lucide-react"; // nice add icon
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


export default function AddCategory({ onCategoryAdded }) {

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: "",
        imageFile: null,
    });

    const { createCategoryWithFormData } = useContextApi();

    const handleCreateCategory = async () => {
        const name = formData.name.trim();
        const description = formData.description.trim();
        if (!name) {
            alert("Category name is required.");
            return;
        }
        if (!description) {
            alert("Description is required.");
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
                if (onCategoryAdded) onCategoryAdded();
                alert("✅ Category created successfully!");
                setFormData({ name: "", description: "", image: "", imageFile: null });
            } else {
                console.log("⚠️ Something went wrong while adding category.", res);
            }
        } catch (error) {
            console.error("Error creating category:", error);
            alert("❌ Failed to create category. Check console for details.");
        } finally {
            setLoading(false);
        }
    }



    return (
        <>

            {/* Top bar container */}
            <div className="flex w-full items-center justify-end rounded-t-md border-b border-gray-100 bg-gray-100 p-2">
                <AlertDialog>

                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className='bg-blue-500 font-medium text-white hover:bg-blue-700 hover:text-white'>
                            <Plus />Add Category
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>

                        <AlertDialogHeader>
                            <AlertDialogTitle>Do you want to create a New Category ?</AlertDialogTitle>

                            <AlertDialogDescription className='text-gray-600'>
                                Please provide a name and description for your new category. This action cannot be undone.
                            </AlertDialogDescription>

                        </AlertDialogHeader>

                        <AddCategoryField formData={formData} setFormData={setFormData} />

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                            {/*<AlertDialogCancel>Cancel</AlertDialogCancel>*/}
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
