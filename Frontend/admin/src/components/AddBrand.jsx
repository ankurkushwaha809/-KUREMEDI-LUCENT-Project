import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import AddBrandField from "./AddBrandField";
import { useContextApi } from "../hooks/useContextApi";

export default function AddBrand({ onBrandAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", logo: "", logoFile: null });
    const { createBrandWithFormData } = useContextApi();

    const handleSubmit = async () => {
        const name = formData.name?.trim();
        if (!name) {
            alert("Brand name is required.");
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("name", name);
            fd.append("description", formData.description?.trim() || "");
            if (formData.logoFile) fd.append("logo", formData.logoFile);
            const res = await createBrandWithFormData(fd);
            if (res?.success) {
                setOpen(false);
                setFormData({ name: "", description: "", logo: "", logoFile: null });
                if (onBrandAdded) onBrandAdded();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="mb-4 gap-2 bg-black text-white hover:bg-gray-800">
                    <Plus size={18} /> Add Brand
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Brand</DialogTitle>
                    <DialogDescription>Enter details to create a new product brand.</DialogDescription>
                </DialogHeader>
                <AddBrandField formData={formData} setFormData={setFormData} />
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Creating..." : "Save Brand"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}