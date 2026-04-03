import React, { useEffect, useMemo, useState } from "react";
import { useContextApi } from "../hooks/useContextApi";
import AddCategory from "./AddCategory";
import AddBrand from "./AddBrand";
import AddProductModal from "./AddProductModal";

/* ================= MAIN INVENTORY DASHBOARD ================= */

export default function Inventory() {

  /* ================= API ================= */
  const {
    getProducts,
    GetCategoryData,
    getBrands, // ✅ FIXED (was getAllBrands)
  } = useContextApi();

  /* ================= STATE ================= */

  const [activeTab, setActiveTab] = useState("products");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);

  const [openProductModal, setOpenProductModal] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const productRes = await getProducts();
      const categoryRes = await GetCategoryData();
      const brandRes = await getBrands(); // ✅ FIXED

      setProducts(Array.isArray(productRes) ? productRes : []);
      setCategories(categoryRes?.data || categoryRes || []); // ✅ FIXED
      setBrands(brandRes?.data || brandRes || []); // ✅ FIXED

    } catch (error) {
      console.error("Inventory Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  /* ================= PRODUCT HELPERS ================= */

  const getStock = (p) => p?.stockQuantity ?? p?.stock ?? 0;

  const getCategoryName = (p) => {
    if (typeof p.category === "object") return p.category?.name;
    return p.category || "-";
  };

  /* ================= PRODUCT STATS ================= */

  const totalProducts = products.length;

  const inStock = products.filter((p) => getStock(p) > 10).length;

  const lowStock = products.filter((p) => {
    const s = getStock(p);
    return s > 0 && s <= 10;
  }).length;

  const outStock = products.filter((p) => getStock(p) === 0).length;


  /* ================= CATEGORY STATS ================= */

  const totalCategories = categories.length;

  const categoryProductMap = useMemo(() => {

    const map = {};

    products.forEach((p) => {
      const name = getCategoryName(p);
      if (!map[name]) map[name] = 0;
      map[name] += 1;
    });

    return map;

  }, [products]);

  const totalCategoryProducts = Object.values(categoryProductMap).reduce(
    (a, b) => a + b,
    0
  );

  const maxCategory = Math.max(0, ...Object.values(categoryProductMap));


  /* ================= BRAND STATS ================= */

  const totalBrands = brands.length;

  const brandMedicineMap = useMemo(() => {

    const map = {};

    products.forEach((p) => {
      const brand = p.brand?.name || p.brand || "-";
      if (!map[brand]) map[brand] = { medicines: 0, stock: 0 };

      map[brand].medicines += 1;
      map[brand].stock += getStock(p);
    });

    return map;

  }, [products]);

  const totalMedicines = Object.values(brandMedicineMap).reduce(
    (sum, b) => sum + b.medicines,
    0
  );

  const totalBrandStock = Object.values(brandMedicineMap).reduce(
    (sum, b) => sum + b.stock,
    0
  );


  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="p-10 text-center text-lg font-medium">
        Loading Inventory...
      </div>
    );
  }

  return (

    <div className="p-6 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Inventory Dashboard
        </h1>

        <div className="flex gap-3">

          <AddCategory onCategoryAdded={fetchAllData} />

          <AddBrand onBrandAdded={fetchAllData} />

          <button
            onClick={() => setOpenProductModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            + Add Product
          </button>

        </div>

      </div>


      {/* ================= TABS ================= */}

      <div className="flex gap-4 mb-6">

        {["products", "categories", "brands"].map((tab) => (

          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? "bg-black text-white"
                : "bg-white border hover:bg-gray-100"
            }`}
          >
            {tab.toUpperCase()}
          </button>

        ))}

      </div>


      {/* ================= PRODUCTS ================= */}

      {activeTab === "products" && (
        <>

          <StatsGrid>

            <StatCard title="Total Products" value={totalProducts} />

            <StatCard title="In Stock" value={inStock} color="green" />

            <StatCard title="Low Stock" value={lowStock} color="orange" />

            <StatCard title="Out of Stock" value={outStock} color="red" />

          </StatsGrid>


          <TableWrapper title="All Products">

            <table className="w-full">

              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {products.map((p) => {

                  const stock = getStock(p);

                  const status =
                    stock === 0
                      ? "Out"
                      : stock <= 10
                      ? "Low"
                      : "In";

                  return (

                    <tr
                      key={p._id || p.id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-3 font-medium">
                        {p.productName || p.name}
                      </td>

                      <td>{getCategoryName(p)}</td>

                      <td>{p.brand?.name || p.brand || "-"}</td>

                      <td>{stock}</td>

                      <td>
                        <Badge
                          color={
                            status === "In"
                              ? "green"
                              : status === "Low"
                              ? "orange"
                              : "red"
                          }
                        >
                          {status}
                        </Badge>
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </TableWrapper>

        </>
      )}


      {/* ================= CATEGORIES ================= */}

      {activeTab === "categories" && (
        <>

          <StatsGrid>

            <StatCard title="Total Categories" value={totalCategories} />

            <StatCard
              title="Total Products"
              value={totalCategoryProducts}
              color="blue"
            />

            <StatCard
              title="Highest Category Products"
              value={maxCategory}
              color="purple"
            />

          </StatsGrid>


          <TableWrapper title="All Categories">

            <table className="w-full">

              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left">Category</th>
                  <th>Total Products</th>
                </tr>
              </thead>

              <tbody>

                {categories.map((c) => {

                  const count = categoryProductMap[c.name] || 0;

                  return (

                    <tr
                      key={c._id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-3 font-medium">
                        {c.name}
                      </td>

                      <td>
                        <Badge color="blue">{count}</Badge>
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </TableWrapper>

        </>
      )}


      {/* ================= BRANDS ================= */}

      {activeTab === "brands" && (
        <>

          <StatsGrid>

            <StatCard title="Total Brands" value={totalBrands} />

            <StatCard
              title="Total Medicines"
              value={totalMedicines}
              color="purple"
            />

            <StatCard
              title="Total Stock"
              value={totalBrandStock}
              color="green"
            />

          </StatsGrid>


          <TableWrapper title="All Brands">

            <table className="w-full">

              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left">Brand</th>
                  <th>Medicines</th>
                  <th>Total Stock</th>
                </tr>
              </thead>

              <tbody>

                {Object.entries(brandMedicineMap).map(([name, data]) => (

                  <tr
                    key={name}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-3 font-medium">{name}</td>

                    <td>
                      <Badge color="purple">{data.medicines}</Badge>
                    </td>

                    <td>
                      <Badge color="green">{data.stock}</Badge>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </TableWrapper>

        </>
      )}


      {/* ================= PRODUCT MODAL ================= */}

      {openProductModal && (
        <AddProductModal
          onClose={() => setOpenProductModal(false)}
          onSuccess={() => {
            setOpenProductModal(false);
            fetchAllData();
          }}
        />
      )}


    </div>
  );
}


/* ================= SMALL COMPONENTS ================= */

const StatsGrid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
    {children}
  </div>
);


const StatCard = ({ title, value, color }) => {

  const colors = {
    green: "text-green-600",
    orange: "text-orange-500",
    red: "text-red-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
  };

  return (

    <div className="bg-white rounded-xl shadow p-5">

      <p className="text-gray-500 text-sm">{title}</p>

      <h3
        className={`text-3xl font-bold mt-2 ${
          colors[color] || "text-black"
        }`}
      >
        {value}
      </h3>

    </div>
  );
};


const Badge = ({ children, color }) => {

  const colors = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (

    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        colors[color]
      }`}
    >
      {children}
    </span>

  );
};


const TableWrapper = ({ title, children }) => (

  <div className="bg-white rounded-xl shadow p-5">

    <h2 className="text-xl font-semibold mb-4">{title}</h2>

    <div className="overflow-x-auto">{children}</div>

  </div>
);
