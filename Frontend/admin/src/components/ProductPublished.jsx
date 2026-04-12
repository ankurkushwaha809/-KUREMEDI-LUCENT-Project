import React, { useEffect, useMemo, useState } from "react";
import { Search, CheckSquare, Square, Loader2 } from "lucide-react";
import { useContextApi } from "../hooks/useContextApi";
import { resolveUploadUrl } from "../lib/baseUrl";

const getProductImageUrl = (p) => {
  const imgs = p?.productImages || p?.images || [];
  const first = Array.isArray(imgs) ? imgs[0] : null;
  if (!first) return null;
  return resolveUploadUrl(first);
};

const ProductPublished = () => {
  const { getProducts, setProductPublishedStatus } = useContextApi();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [savingMap, setSavingMap] = useState({});
  const [selectedIds, setSelectedIds] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load products for publish settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = products.filter((p) => {
      const isPublished = Boolean(p?.isPublished);
      if (filter === "published" && !isPublished) return false;
      if (filter === "unpublished" && isPublished) return false;

      if (!q) return true;
      const text = [
        p?.productName || p?.name || "",
        p?.category?.name || p?.category || "",
        p?.brand?.name || p?.brand || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });

    // Sorting logic
    result = [...result];
    if (sortBy === "name-asc") {
      result.sort((a, b) => (a.productName || a.name || "").localeCompare(b.productName || b.name || ""));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => (b.productName || b.name || "").localeCompare(a.productName || a.name || ""));
    } else if (sortBy === "published") {
      result.sort((a, b) => Number(Boolean(b.isPublished)) - Number(Boolean(a.isPublished)));
    } else if (sortBy === "unpublished") {
      result.sort((a, b) => Number(Boolean(a.isPublished)) - Number(Boolean(b.isPublished)));
    } else if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }
    return result;
  }, [products, search, filter, sortBy]);

  const togglePublished = async (product) => {
    const id = product?._id || product?.id;
    if (!id) return;

    const nextValue = !Boolean(product?.isPublished);
    setSavingMap((prev) => ({ ...prev, [id]: true }));

    try {
      await setProductPublishedStatus(id, nextValue);
      setProducts((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, isPublished: nextValue }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update publish status:", error);
      alert("Failed to update publish status.");
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredIds = useMemo(
    () => filteredProducts.map((p) => p?._id || p?.id).filter(Boolean),
    [filteredProducts]
  );

  const selectedCount = useMemo(
    () => filteredIds.filter((id) => Boolean(selectedIds[id])).length,
    [filteredIds, selectedIds]
  );

  const allFilteredSelected = filteredIds.length > 0 && selectedCount === filteredIds.length;

  const toggleSelectItem = (id) => {
    if (!id) return;
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allFilteredSelected) {
        filteredIds.forEach((id) => {
          delete next[id];
        });
      } else {
        filteredIds.forEach((id) => {
          next[id] = true;
        });
      }
      return next;
    });
  };

  const updateManyPublished = async (ids, isPublished) => {
    const targetIds = Array.from(new Set((ids || []).filter(Boolean)));
    if (targetIds.length === 0) return;

    setBulkLoading(true);
    setSavingMap((prev) => {
      const next = { ...prev };
      targetIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    try {
      await Promise.all(targetIds.map((id) => setProductPublishedStatus(id, isPublished)));

      setProducts((prev) => {
        const idSet = new Set(targetIds);
        return prev.map((item) => {
          const id = item?._id || item?.id;
          return idSet.has(id) ? { ...item, isPublished } : item;
        });
      });

      setSelectedIds((prev) => {
        const next = { ...prev };
        targetIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to update publish status in bulk:", error);
      alert("Failed to update publish status.");
    } finally {
      setSavingMap((prev) => {
        const next = { ...prev };
        targetIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setBulkLoading(false);
    }
  };

  const publishedCount = products.filter((p) => Boolean(p?.isPublished)).length;
  const unpublishedCount = products.length - publishedCount;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Product Published</h1>
        <p className="text-gray-500 mt-1">
          Tick product to show on website. Untick product to hide from website.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Unpublished</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{unpublishedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-5 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute top-3 left-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, category, brand"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-700 font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="published">Published first</option>
              <option value="unpublished">Unpublished first</option>
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
            </select>
            {[
              { key: "all", label: "All" },
              { key: "published", label: "Published" },
              { key: "unpublished", label: "Unpublished" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                  filter === opt.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAllFiltered}
                className="h-4 w-4 rounded border-gray-300"
                disabled={bulkLoading || filteredIds.length === 0}
              />
              Select All ({filteredIds.length})
            </label>
            <span className="text-xs text-gray-500">Selected: {selectedCount}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateManyPublished(filteredIds.filter((id) => selectedIds[id]), true)}
              disabled={bulkLoading || selectedCount === 0}
              className="px-3 py-2 text-sm rounded-lg border border-green-800 bg-green-700 text-white hover:bg-green-800 disabled:opacity-60"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => updateManyPublished(filteredIds.filter((id) => selectedIds[id]), false)}
              disabled={bulkLoading || selectedCount === 0}
              className="px-3 py-2 text-sm rounded-lg border border-orange-800 bg-orange-700 text-white hover:bg-orange-800 disabled:opacity-60"
            >
              Unpublish
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-56 rounded-xl bg-white border border-gray-100 p-4">
              <div className="h-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 mt-4 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 mt-2 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 border border-gray-100 shadow-sm">
          No products found for selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const id = p?._id || p?.id;
            const isPublished = Boolean(p?.isPublished);
            const isSaving = Boolean(savingMap[id]);
            const imageUrl = getProductImageUrl(p);

            return (
              <div
                key={id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col"
              >
                <div className="mb-2 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds[id])}
                      onChange={() => toggleSelectItem(id)}
                      disabled={isSaving || bulkLoading}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Select
                  </label>
                </div>

                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={p?.productName || "Product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="mt-3 flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-12">
                    {p?.productName || p?.name || "Unnamed product"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {p?.category?.name || p?.category || "-"} | {p?.brand?.name || p?.brand || "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Stock: {p?.stockQuantity ?? p?.stock ?? 0}</p>
                </div>

                <button
                  type="button"
                  onClick={() => togglePublished(p)}
                  disabled={isSaving}
                  className={`mt-3 w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition ${
                    isPublished
                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : isPublished ? (
                    <>
                      <CheckSquare size={16} /> Published
                    </>
                  ) : (
                    <>
                      <Square size={16} /> Unpublished
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductPublished;
