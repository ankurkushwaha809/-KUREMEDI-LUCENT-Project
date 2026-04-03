import React, { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Filter } from "lucide-react";
import { useContextApi } from "../hooks/useContextApi";

const LowStockAlerts = () => {
  const { getProducts, GetCategoryData } = useContextApi();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minStock, setMinStock] = useState(0);
  const [maxStock, setMaxStock] = useState(10);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const prodRes = await getProducts();
        const catRes = await GetCategoryData();

        setProducts(Array.isArray(prodRes) ? prodRes : []);
        setCategories(catRes?.data || []);
      } catch (err) {
        console.error("Error loading data", err);
      }
    };

    loadData();
  }, [getProducts, GetCategoryData]);

  /* ================= HELPERS ================= */
  const stockValue = (p) => p.stockQuantity ?? p.stock ?? 0;

  /* ================= FILTERED PRODUCTS ================= */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = stockValue(p);
      const category =
        typeof p.category === "object" ? p.category?.name : p.category;

      const matchCategory =
        selectedCategory === "All" || category === selectedCategory;

      const matchStock = stock >= minStock && stock <= maxStock;

      return matchCategory && matchStock;
    });
  }, [products, selectedCategory, minStock, maxStock]);

  /* ================= ALERT PRODUCTS ( ≤5 ) ================= */
  const alertProducts = useMemo(() => {
    return products.filter((p) => stockValue(p) <= 5);
  }, [products]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Low Stock & Alerts
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor low stock and out-of-stock products
          </p>
        </div>

        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={22} />
          <span className="font-semibold">
            Alerts: {alertProducts.length}
          </span>
        </div>
      </div>

      {/* ================= ALERT BANNER ================= */}
      {alertProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          ⚠️ {alertProducts.length} products have stock ≤ 5. Please restock soon.
        </div>
      )}

      {/* ================= FILTERS ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          >
            <option value="All">All</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min Stock */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Min Stock
          </label>
          <input
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        {/* Max Stock */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Max Stock
          </label>
          <input
            type="number"
            value={maxStock}
            onChange={(e) => setMaxStock(Number(e.target.value))}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedCategory("All");
              setMinStock(0);
              setMaxStock(10);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            <Filter size={16} /> Reset
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-3">Product</th>
              <th className="text-left py-3">Category</th>
              <th className="text-left py-3">Stock</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => {
              const stock = stockValue(p);
              const category =
                typeof p.category === "object"
                  ? p.category?.name
                  : p.category;

              const status =
                stock === 0
                  ? "Out of Stock"
                  : stock <= 5
                  ? "Critical"
                  : stock <= 10
                  ? "Low"
                  : "Normal";

              return (
                <tr key={p._id || p.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">
                    {p.productName || p.name}
                  </td>

                  <td className="py-3">{category || "-"}</td>

                  <td className="py-3 font-semibold">{stock}</td>

                  <td className="py-3">
                    <StatusBadge status={status} />
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-500"
                >
                  No low/out-of-stock products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowStockAlerts;

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  const map = {
    Normal: "bg-green-100 text-green-700",
    Low: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
    "Out of Stock": "bg-gray-200 text-gray-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
};
