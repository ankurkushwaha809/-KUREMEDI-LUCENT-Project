import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
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
import { getErrorMessage, logError } from "../utils/errorHandler";

export default function AddBrand({ onBrandAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [formData, setFormData] = useState({ name: "", description: "", logo: "", logoFile: null });
    const { createBrandWithFormData } = useContextApi();

    const handleSubmit = async () => {
        setErrorMsg("");
        setSuccessMsg("");

        const name = formData.name?.trim();
        if (!name) {
            setErrorMsg("Brand name is required.");
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
                setSuccessMsg("Brand created successfully!");
                setFormData({ name: "", description: "", logo: "", logoFile: null });
                setTimeout(() => {
                    setOpen(false);
                    if (onBrandAdded) onBrandAdded();
                }, 1000);
            } else {
                const message = res?.message || res?.msg || "Failed to create brand";
                setErrorMsg(message);
                logError("Brand creation", new Error(message));
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            setErrorMsg(errorMessage);
            logError("Brand creation", error);
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