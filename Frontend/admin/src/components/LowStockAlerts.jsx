import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Filter,
  PackageX,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useContextApi } from "../hooks/useContextApi";

const MAX_STOCK_DEFAULT = 999999;

const LowStockAlerts = () => {
  const { getProducts, GetCategoryData } = useContextApi();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minStock, setMinStock] = useState(0);
  const [maxStock, setMaxStock] = useState(MAX_STOCK_DEFAULT);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const prodRes = await getProducts();
        const catRes = await GetCategoryData();

        setProducts(Array.isArray(prodRes) ? prodRes : []);
        setCategories(catRes?.data || []);
      } catch (err) {
        console.error("Error loading low stock data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getProducts, GetCategoryData]);

  const stockValue = (p) => p.stockQuantity ?? p.stock ?? 0;
  const minLevelValue = (p) => p.minStockLevel ?? p.minStock ?? 0;
  const categoryValue = (p) =>
    typeof p.category === "object" ? p.category?.name : p.category;

  const productDisplayName = (p) => {
    const direct = String(p?.productName || p?.name || "").trim();
    if (direct) return direct;

    const brand = String(p?.brand?.name || p?.brand || "").trim();
    const batch = String(p?.batchNumber || "").trim();
    if (brand || batch) {
      return [brand, batch ? `Batch ${batch}` : ""].filter(Boolean).join(" - ");
    }

    const code = String(p?._id || p?.id || p?.sku || "").trim();
    return code ? `Product #${code.slice(-6)}` : "Unknown Product";
  };

  const isLowOrOutOfStock = (p) => stockValue(p) <= minLevelValue(p);

  const getStatus = (p) => {
    const stock = stockValue(p);
    const threshold = minLevelValue(p);

    if (stock <= 0) return "Out of Stock";
    if (threshold > 0 && stock === threshold) return "At Minimum";
    if (stock <= threshold) return "Low Stock";
    return "Normal";
  };

  const getAlertMessage = (p) => {
    const stock = stockValue(p);
    const threshold = minLevelValue(p);

    if (stock <= 0) {
      return "Product is out of stock. Immediate restock required.";
    }

    if (threshold > 0 && stock === threshold) {
      return `Minimum stock reached (${threshold}). Please reorder now.`;
    }

    if (stock < threshold) {
      return `Stock is below minimum level by ${threshold - stock}.`;
    }

    return "Stock is healthy.";
  };

  const alertProducts = useMemo(
    () => products.filter((p) => isLowOrOutOfStock(p)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return alertProducts
      .filter((p) => {
        const stock = stockValue(p);
        const category = categoryValue(p);
        const status = getStatus(p);

        const matchCategory =
          selectedCategory === "All" || category === selectedCategory;
        const matchStock = stock >= minStock && stock <= maxStock;
        const matchStatus = statusFilter === "All" || status === statusFilter;

        return matchCategory && matchStock && matchStatus;
      })
      .sort((a, b) => {
        const aStock = stockValue(a);
        const bStock = stockValue(b);
        const aThreshold = minLevelValue(a);
        const bThreshold = minLevelValue(b);

        const aUrgency = aStock <= 0 ? -1000 : aStock - aThreshold;
        const bUrgency = bStock <= 0 ? -1000 : bStock - bThreshold;

        return aUrgency - bUrgency;
      });
  }, [alertProducts, selectedCategory, minStock, maxStock, statusFilter]);

  const outOfStockCount = useMemo(
    () => alertProducts.filter((p) => stockValue(p) <= 0).length,
    [alertProducts]
  );

  const atMinimumCount = useMemo(
    () =>
      alertProducts.filter((p) => {
        const stock = stockValue(p);
        const threshold = minLevelValue(p);
        return stock > 0 && stock === threshold;
      }).length,
    [alertProducts]
  );

  const lowStockCount = Math.max(
    0,
    alertProducts.length - outOfStockCount - atMinimumCount
  );

  const resetFilters = () => {
    setSelectedCategory("All");
    setMinStock(0);
    setMaxStock(MAX_STOCK_DEFAULT);
    setStatusFilter("All");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <AlertTriangle size={14} />
                Inventory Watchlist
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Low Stock Alerts
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Products where current stock is at or below their minimum stock level.
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw size={16} />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Alerts"
            value={alertProducts.length}
            icon={<ShieldAlert size={18} />}
            tone="red"
          />
          <StatCard
            title="Out of Stock"
            value={outOfStockCount}
            icon={<PackageX size={18} />}
            tone="slate"
          />
          <StatCard
            title="At Minimum"
            value={atMinimumCount}
            icon={<AlertTriangle size={18} />}
            tone="amber"
          />
          <StatCard
            title="Low Stock"
            value={lowStockCount}
            icon={<Boxes size={18} />}
            tone="blue"
          />
        </div>

        {alertProducts.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Attention:</span> {alertProducts.length} products have reached or gone below their set minimum stock.
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <Filter size={18} />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
              >
                <option value="All">All</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Min Stock</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Max Stock</label>
              <input
                type="number"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
              >
                <option value="All">All</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="At Minimum">At Minimum</option>
                <option value="Low Stock">Low Stock</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Critical Products</h2>
            <span className="text-xs text-slate-500">
              Showing {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading alerts...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">
              No low or out-of-stock products found for the selected filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((p) => {
                const stock = stockValue(p);
                const threshold = minLevelValue(p);
                const productName = productDisplayName(p);
                const category = categoryValue(p) || "-";
                const status = getStatus(p);
                const alertMessage = getAlertMessage(p);
                const ratio =
                  threshold > 0
                    ? Math.min(100, Math.max(0, Math.round((stock / threshold) * 100)))
                    : 0;

                return (
                  <div
                    key={p._id || p.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{productName}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Category: {category}</p>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                      <InfoPill label="Available Quantity" value={stock} />
                      <InfoPill label="Reorder Point" value={threshold} />
                      <InfoPill label="Shortage" value={Math.abs(stock - threshold)} />
                    </div>

                    <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {alertMessage}
                    </p>

                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>Stock vs Minimum</span>
                        <span>{threshold > 0 ? `${ratio}%` : "N/A"}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            status === "Out of Stock"
                              ? "bg-slate-400"
                              : status === "At Minimum"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${threshold > 0 ? ratio : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, tone }) => {
  const toneMap = {
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg border px-2 py-1 ${toneMap[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
};

const InfoPill = ({ label, value }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-900">{value}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Normal: "border border-green-200 bg-green-50 text-green-700",
    "Low Stock": "border border-red-200 bg-red-50 text-red-700",
    "At Minimum": "border border-amber-200 bg-amber-50 text-amber-700",
    "Out of Stock": "border border-slate-300 bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] || map.Normal}`}
    >
      {status}
    </span>
  );
};

export default LowStockAlerts;
