import React from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const IMAGE_BASE_URL = "https://api.kuremedi.com";

const getLogoPreviewUrl = (formData) => {
    if (formData.logoFile) return URL.createObjectURL(formData.logoFile);
    if (formData.logo) {
        const p = String(formData.logo).replace(/\\/g, "/").replace(/^\//, "");
        return p.startsWith("http") ? p : `${IMAGE_BASE_URL}/${p}`;
    }
    return null;
};

export default function AddBrandField({ formData, setFormData }) {
    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData((prev) => ({ ...prev, logoFile: file }));
        e.target.value = "";
    };

    const previewUrl = getLogoPreviewUrl(formData);

    return (
        <div className="space-y-4">
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="brand-name">Brand Name <span className="text-red-500">*</span></FieldLabel>
                    <Input
                        id="brand-name"
                        placeholder="e.g., Nike, Samsung, Apple"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="brand-desc">Description</FieldLabel>
                    <Textarea
                        id="brand-desc"
                        placeholder="Optional brand description or tagline"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        className="resize-none"
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="brand-logo">Brand Logo (optional)</FieldLabel>
                    <Input
                        id="brand-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                    />
                </Field>

                {previewUrl && (
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <img
                            src={previewUrl}
                            alt="Brand preview"
                            className="h-16 w-16 rounded-md border object-cover shadow-sm"
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    </div>
                )}
            </FieldGroup>
        </div>
    );
}