import React from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const IMAGE_BASE_URL = "https://api.kuremedi.com";

const getImagePreviewUrl = (formData) => {
    if (formData.imageFile) return URL.createObjectURL(formData.imageFile);
    if (formData.image) {
        const p = String(formData.image).replace(/\\/g, "/").replace(/^\//, "");
        return p.startsWith("http") ? p : `${IMAGE_BASE_URL}/${p}`;
    }
    return null;
};

export default function AddCategoryField({ formData, setFormData }) {
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData((prev) => ({ ...prev, imageFile: file }));
        e.target.value = "";
    };

    const previewUrl = getImagePreviewUrl(formData);

    return (
        <div className="space-y-4">
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="category-name">Category Name <span className="text-red-500">*</span></FieldLabel>
                    <Input
                        id="category-name"
                        placeholder="e.g., Electronics"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="category-desc">Description <span className="text-red-500">*</span></FieldLabel>
                    <Textarea
                        id="category-desc"
                        placeholder="Optional description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        className="resize-none"
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="category-image">Image (optional)</FieldLabel>
                    <Input id="category-image" type="file" accept="image/*" onChange={handleImageChange} />
                </Field>

                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="Category preview"
                        className="mt-2 h-16 w-16 rounded-md border object-cover"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                )}
            </FieldGroup>
        </div>
    );
}
