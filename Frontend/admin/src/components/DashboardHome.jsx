import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  CreditCard,
  ShoppingCart,
  BarChart2,
  Package,
  Layers,
  Tag,
  UserCheck,
  UserCircle2,
} from "lucide-react";
import { useContextApi } from '../hooks/useContextApi';

const COLORS = ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff", "#a55eea", "#fd9644"];

const DashboardHome = () => {
  const loggedInRole = "SUPERADMIN";
  const [filter, setFilter] = useState("week");

  const { getAllUsers, getallOrders, GetCategoryData, getProducts, getBrands } = useContextApi();
  const [userData, setUserData] = useState([]);
  const [orders, setorders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUserData(res?.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [getAllUsers]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getallOrders();
        setorders(res?.data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, [getallOrders]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await GetCategoryData();
        setCategories(res?.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [GetCategoryData]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts();
        setProducts(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [getProducts]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await getBrands();
        setBrands(res?.data || []);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, [getBrands]);
  const parsedOrders = orders?.map(order => ({
    date: new Date(order.orderDate || order.createdAt),
    amount: order.totalAmt || 0,
  })) || [];

  const totalIncome = orders?.reduce((sum, order) => sum + (order?.totalAmt || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const averageOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;
  const totalProductsSold = orders?.reduce(
    (sum, order) => sum + (order?.cartItems || []).reduce((s, it) => s + (it?.quantity || 0), 0),
    0
  ) || 0;

  // Basic role-based breakdown for retailers and agents (best-effort, flexible keys)
  const getUserRoleKey = (u) =>
    (u?.role || u?.userType || u?.type || "").toString().toUpperCase();
  const retailersCount = userData.filter((u) =>
    getUserRoleKey(u).includes("RETAIL")
  ).length;
  const agentsCount = userData.filter((u) =>
    getUserRoleKey(u).includes("AGENT")
  ).length;

  const getFilteredSales = (filterType) => {
    const now = new Date();

    switch (filterType) {
      case "today": {
        const today = parsedOrders.filter(o =>
          o.date.toDateString() === now.toDateString()
        );
        return today.map(o => ({
          name: o.date.getHours() + ":00",
          sales: o.amount,
        }));
      }

      case "week": {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);

        const weekData = parsedOrders.filter(o => o.date >= weekAgo);

        const dailyTotals = {};
        weekData.forEach(o => {
          const day = o.date.toLocaleDateString("en-US", { weekday: "short" });
          dailyTotals[day] = (dailyTotals[day] || 0) + o.amount;
        });

        return Object.keys(dailyTotals).map(day => ({
          name: day,
          sales: dailyTotals[day],
        }));
      }

      case "month": {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);

        const monthData = parsedOrders.filter(o => o.date >= monthAgo);

        const weekTotals = {};
        monthData.forEach(o => {
          const weekNum = Math.ceil(o.date.getDate() / 7);
          weekTotals[`Week ${weekNum}`] =
            (weekTotals[`Week ${weekNum}`] || 0) + o.amount;
        });

        return Object.keys(weekTotals).map(week => ({
          name: week,
          sales: weekTotals[week],
        }));
      }

      case "quarter": {
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);

        const quarterData = parsedOrders.filter(o => o.date >= quarterAgo);

        const monthTotals = {};
        quarterData.forEach(o => {
          const month = o.date.toLocaleString("en-US", { month: "short" });
          monthTotals[month] = (monthTotals[month] || 0) + o.amount;
        });

        return Object.keys(monthTotals).map(month => ({
          name: month,
          sales: monthTotals[month],
        }));
      }

      case "year": {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);

        const yearData = parsedOrders.filter(o => o.date >= yearAgo);

        const monthlyTotals = {};
        yearData.forEach(o => {
          const month = o.date.toLocaleString("en-US", { month: "short" });
          monthlyTotals[month] = (monthlyTotals[month] || 0) + o.amount;
        });

        return Object.keys(monthlyTotals).map(month => ({
          name: month,
          sales: monthlyTotals[month],
        }));
      }

      default:
        return [];
    }
  };

  // Products by Category (from products API - category populated)
  const productsByCategory = {};
  products.forEach((p) => {
    const cat = p?.category?.name || "Uncategorized";
    productsByCategory[cat] = (productsByCategory[cat] || 0) + 1;
  });
  const categoryPieData = Object.keys(productsByCategory).map((name) => ({
    name,
    value: productsByCategory[name],
  }));

  // Order Status distribution
  const orderStatusCount = {};
  orders.forEach((o) => {
    const s = o?.status || "PLACED";
    orderStatusCount[s] = (orderStatusCount[s] || 0) + 1;
  });
  const orderStatusPieData = Object.keys(orderStatusCount).map((name) => ({
    name,
    value: orderStatusCount[name],
  }));

  // Products by Category (Bar chart)
  const productsByCategoryBarData = Object.keys(productsByCategory).map((name) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    count: productsByCategory[name],
  }));

  // Products by Brand (Bar chart)
  const productsByBrandCount = {};
  products.forEach((p) => {
    const b = p?.brand?.name || "No Brand";
    productsByBrandCount[b] = (productsByBrandCount[b] || 0) + 1;
  });
  const productsByBrandBarData = Object.keys(productsByBrandCount).map((name) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    count: productsByBrandCount[name],
  }));

  // User registrations over time (by month)
  const userRegByMonth = {};
  userData.forEach((u) => {
    if (!u?.createdAt) return;
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    userRegByMonth[key] = (userRegByMonth[key] || 0) + 1;
  });
  const userRegistrationData = Object.keys(userRegByMonth)
    .sort()
    .slice(-6)
    .map((key) => ({
      name: key.replace("-", "/"),
      users: userRegByMonth[key],
    }));

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {loggedInRole === "SUPERADMIN" ? (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                ERP Analytics Overview
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Key KPIs for retailers, agents, orders, and product catalogue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm border border-slate-200">
              {["today", "week", "month", "quarter", "year"].map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 text-xs sm:text-sm rounded-full transition ${
                    filter === key
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-slate-200">
            {/* Stats Row */}
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Total Income
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      ₹ {totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Total Orders
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {totalOrders}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Avg. Order Value
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      ₹ {averageOrderValue.toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-50 p-2 text-amber-600">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Products Sold
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {totalProductsSold}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                    <Package className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Retailers
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {retailersCount}
                    </p>
                  </div>
                  <div className="rounded-full bg-indigo-50 p-2 text-indigo-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Agents
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {agentsCount}
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-50 p-2 text-sky-600">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Categories
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {categories.length}
                    </p>
                  </div>
                  <div className="rounded-full bg-violet-50 p-2 text-violet-600">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Brands
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {brands.length}
                    </p>
                  </div>
                  <div className="rounded-full bg-rose-50 p-2 text-rose-600">
                    <Tag className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Analytics Body */}
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              {/* Charts Row 1 - Sales & Order Status */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:col-span-7 lg:col-span-7">
                  <h6 className="mb-2 text-sm font-semibold text-slate-800">
                    Sales Overview
                  </h6>
                  <p className="mb-3 text-xs text-slate-500">
                    Revenue trend based on selected time filter.
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={getFilteredSales(filter)}>
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#0f172a"
                        strokeWidth={2}
                        name="Sales (₹)"
                      />
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [`₹ ${v}`, "Sales"]} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:col-span-5 lg:col-span-5">
                  <h6 className="mb-2 text-sm font-semibold text-slate-800">
                    Order Status Distribution
                  </h6>
                  <p className="mb-3 text-xs text-slate-500">
                    Breakdown of current orders by lifecycle stage.
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={orderStatusPieData}
                        dataKey="value"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {orderStatusPieData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 - Category & Brand Mix */}
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:col-span-6 lg:col-span-4">
                  <h6 className="mb-2 text-sm font-semibold text-slate-800">
                    Products by Category
                  </h6>
                  <p className="mb-3 text-xs text-slate-500">
                    Share of SKUs across different product categories.
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        outerRadius={85}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:col-span-6 lg:col-span-4">
                  <h6 className="mb-2 text-sm font-semibold text-slate-800">
                    Category Depth (Bar)
                  </h6>
                  <p className="mb-3 text-xs text-slate-500">
                    Number of products available in each category.
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={productsByCategoryBarData}
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#54a0ff"
                        name="Products"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:col-span-6 lg:col-span-4">
                  <h6 className="mb-2 text-sm font-semibold text-slate-800">
                    Brand Coverage (Bar)
                  </h6>
                  <p className="mb-3 text-xs text-slate-500">
                    Distribution of products across different brands.
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={productsByBrandBarData}
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#1dd1a1"
                        name="Products"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 3 - User / Partner Analytics */}
              <div className="mt-6 grid grid-cols-1 gap-4">
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <h6 className="mb-2 text-sm font-semibold text-slate-800">
                    User & Partner Onboarding (Last 6 Months)
                  </h6>
                  <p className="mb-3 text-xs text-slate-500">
                    New retailers, agents, and users registered on the platform.
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={userRegistrationData} margin={{ top: 10 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="users"
                        fill="#a55eea"
                        name="New Users"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-[80vh] w-full items-center justify-center">
          <div className="max-w-md rounded-2xl border bg-white p-10 text-center shadow-2xl">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Access Denied
            </h2>
            <p className="text-lg text-gray-600">
              This route is only for{" "}
              <span className="font-semibold">Superadmin</span>.
            </p>

            <div className="mt-5 flex justify-center">
              <div className="rounded-full bg-red-200 px-6 py-2 font-medium text-red-700">
                Unauthorized Access
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome
