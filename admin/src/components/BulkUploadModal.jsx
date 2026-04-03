import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useContextApi } from "../hooks/useContextApi";

const TEMPLATE_HEADERS = [
  "Product Name",
  "MRP",
  "Selling Price",
  "Composition",
  "Manufacturer",
  "Category",
  "Brand",
  "Discount %",
  "GST %",
  "HSN Code",
  "Batch Number",
  "Expiry Date",
  "Stock Qty",
  "Min Stock",
  "Min Order",
  "Active",
  "Prescription Required",
];

const BulkUploadModal = ({ onClose, onSuccess }) => {
  const { bulkImportProducts } = useContextApi();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState(null);
  const inputRef = useRef(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ["Example Product", 100, 80, "Paracetamol 500mg", "ABC Pharma", "Medicines", "BrandX", 20, 12, "3004", "BATCH001", "2025-12-31", 100, 10, 1, "true", "false"],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ]);
    ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "product_bulk_template.xlsx");
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
          if (rows.length < 2) {
            reject(new Error("Excel must have at least a header row and one data row"));
            return;
          }
          const headers = rows[0].map((h) => String(h || "").trim());
          const products = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const obj = {};
            headers.forEach((h, j) => {
              const val = row[j];
              if (val !== undefined && val !== null && String(val).trim() !== "") {
                obj[h] = val;
              }
            });
            if (Object.keys(obj).length > 0) {
              products.push(obj);
            }
          }
          resolve(products);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setParseError(null);
    setResult(null);
    setFile(f);

    try {
      await parseExcel(f);
    } catch (err) {
      setParseError(err.message || "Invalid Excel file");
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select an Excel file first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setParseError(null);
    try {
      const products = await parseExcel(file);
      if (products.length === 0) {
        setParseError("No valid product rows found in the file.");
        return;
      }
      const res = await bulkImportProducts(products);
      setResult(res);
      if (res.created > 0 && onSuccess) onSuccess();
    } catch (err) {
      setParseError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setParseError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet size={22} />
            Bulk Upload Products
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Upload an Excel (.xlsx) file with product data. Download the template below for the correct format.
          </p>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 w-full justify-center py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-gray-700"
          >
            <Download size={18} />
            Download Excel Template
          </button>

          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <Upload size={40} className="text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {file ? file.name : "Click to select Excel file"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {parseError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {parseError}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm space-y-1">
              <p className="font-semibold">Import complete</p>
              <p>Created: {result.created} | Failed: {result.failed} | Total: {result.total}</p>
              {result.errors?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600">View errors</summary>
                  <ul className="mt-1 text-xs space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button onClick={handleClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload & Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
