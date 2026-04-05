import React, { useEffect, useRef, useState } from "react";
import {
    Calendar,
    Bell,
    LogOut,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    PackageX,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContextApi } from "../hooks/useContextApi";

const Navbar = ({ className = "" }) => {
    const loggedInSalesName = "KUREMEDI LUCENT bio 33 ";
    const navigate = useNavigate();
    const [, setSearchParams] = useSearchParams();
    const { setActiveTab, getProducts } = useContextApi();

    const [lowStockCount, setLowStockCount] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const calendarRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const loadLowStockCount = async () => {
            try {
                const products = await getProducts();
                const list = Array.isArray(products)
                    ? products
                    : Array.isArray(products?.data)
                    ? products.data
                    : [];
                const count = list.filter((p) => {
                    const stock = p?.stockQuantity ?? p?.stock ?? 0;
                    const minStock = p?.minStockLevel ?? p?.minStock ?? 0;
                    return stock <= minStock;
                });

                const sortedLowStock = count
                    .sort((a, b) => {
                        const aStock = a?.stockQuantity ?? a?.stock ?? 0;
                        const aMin = a?.minStockLevel ?? a?.minStock ?? 0;
                        const bStock = b?.stockQuantity ?? b?.stock ?? 0;
                        const bMin = b?.minStockLevel ?? b?.minStock ?? 0;
                        return aStock - aMin - (bStock - bMin);
                    })
                    .slice(0, 8);

                setLowStockCount(count.length);
                setLowStockProducts(sortedLowStock);
            } catch (error) {
                console.error("Failed to load low stock count", error);
            }
        };

        loadLowStockCount();
    }, [getProducts]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }
        };

        if (showCalendar || showNotifications) {
            document.addEventListener("mousedown", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [showCalendar, showNotifications]);

    const getProductDisplayName = (product) => {
        const directName =
            product?.productName || product?.name || product?.title || "";
        if (String(directName).trim()) return String(directName).trim();

        const brand = String(product?.brand?.name || product?.brand || "").trim();
        const batch = String(product?.batchNumber || "").trim();
        if (brand || batch) {
            return [brand, batch ? `Batch ${batch}` : ""].filter(Boolean).join(" - ");
        }

        const code =
            String(product?._id || product?.id || product?.sku || "").trim();
        return code ? `Product #${code.slice(-6)}` : "Unknown Product";
    };

    const getNotificationMeta = (product) => {
        const stock = product?.stockQuantity ?? product?.stock ?? 0;
        const minStock = product?.minStockLevel ?? product?.minStock ?? 0;

        if (stock <= 0) {
            return {
                label: "Out of Stock",
                message: "Immediate restock needed",
                badgeClass: "border-red-200 bg-red-50 text-red-700",
                iconClass: "text-red-600",
                Icon: PackageX,
            };
        }

        if (stock === minStock) {
            return {
                label: "At Minimum",
                message: "Minimum stock reached",
                badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
                iconClass: "text-amber-600",
                Icon: AlertTriangle,
            };
        }

        return {
            label: "Low Stock",
            message: `Short by ${Math.max(0, minStock - stock)} unit(s)`,
            badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
            iconClass: "text-orange-600",
            Icon: AlertTriangle,
        };
    };

    const openTab = (tabName) => {
        setActiveTab(tabName);
        setSearchParams({ tab: tabName });
    };

    const handleCalendarClick = () => {
        setShowCalendar((prev) => !prev);
    };

    const goToPreviousMonth = () => {
        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const daysInMonth = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        0
    ).getDate();
    const firstDayOfWeek = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        1
    ).getDay();
    const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const dayCells = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const isToday = (day) => {
        const today = new Date();
        return (
            day &&
            today.getFullYear() === calendarMonth.getFullYear() &&
            today.getMonth() === calendarMonth.getMonth() &&
            today.getDate() === day
        );
    };

    const isSelected = (day) => {
        return (
            day &&
            selectedDate.getFullYear() === calendarMonth.getFullYear() &&
            selectedDate.getMonth() === calendarMonth.getMonth() &&
            selectedDate.getDate() === day
        );
    };

    const handleLowStockClick = () => {
        setShowNotifications((prev) => !prev);
    };

    const handleOpenLowStockPage = () => {
        openTab("Low Stock Alerts");
        setShowNotifications(false);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full bg-[ghostwhite] shadow-sm z-50 ${className}`}>
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center bg-gray-800 rounded w-8 h-8">
                        <div className="w-4 h-4 border-2 border-white border-r-0 border-b-0 rotate-45"></div>
                    </div>
                    <span className="text-gray-900 text-lg font-semibold tracking-wide">
                        {loggedInSalesName}
                    </span>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-4">
                    <div className="relative" ref={calendarRef}>
                        <button
                            type="button"
                            onClick={handleCalendarClick}
                            title="Open calendar"
                            className="text-gray-600 hover:text-gray-900 transition"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>
                        {showCalendar && (
                            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl p-3 z-50">
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        onClick={goToPreviousMonth}
                                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {calendarMonth.toLocaleDateString(undefined, {
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={goToNextMonth}
                                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {weekdayLabels.map((label) => (
                                        <div
                                            key={label}
                                            className="h-7 flex items-center justify-center text-[11px] font-semibold text-gray-500"
                                        >
                                            {label}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {dayCells.map((day, index) => (
                                        <button
                                            key={`${calendarMonth.getMonth()}-${calendarMonth.getFullYear()}-${index}`}
                                            type="button"
                                            disabled={!day}
                                            onClick={() => {
                                                if (!day) return;
                                                setSelectedDate(
                                                    new Date(
                                                        calendarMonth.getFullYear(),
                                                        calendarMonth.getMonth(),
                                                        day
                                                    )
                                                );
                                            }}
                                            className={`h-8 rounded-md text-sm transition ${
                                                !day
                                                    ? "cursor-default"
                                                    : isSelected(day)
                                                    ? "bg-blue-600 text-white"
                                                    : isToday(day)
                                                    ? "bg-blue-100 text-blue-700 font-semibold"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            {day || ""}
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    Selected: {selectedDate.toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={notificationRef}>
                        <button
                            type="button"
                            onClick={handleLowStockClick}
                            title="Open notifications"
                            className="relative text-gray-600 hover:text-gray-900 transition"
                        >
                            <Bell className="w-5 h-5" />
                            {lowStockCount > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                                    {lowStockCount > 99 ? "99+" : lowStockCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                                <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50">
                                    <p className="text-sm font-semibold text-slate-900">Inventory Notifications</p>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {lowStockCount > 0
                                            ? `${lowStockCount} product(s) need attention`
                                            : "No stock risk right now"}
                                    </p>
                                </div>

                                <div className="max-h-80 overflow-auto p-2">
                                    {lowStockProducts.length === 0 ? (
                                        <div className="m-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-sm text-emerald-700">
                                            All products are above minimum stock level.
                                        </div>
                                    ) : (
                                        lowStockProducts.map((product) => {
                                            const stock = product?.stockQuantity ?? product?.stock ?? 0;
                                            const minStock =
                                                product?.minStockLevel ?? product?.minStock ?? 0;
                                            const notificationMeta = getNotificationMeta(product);
                                            const Icon = notificationMeta.Icon;
                                            return (
                                                <div
                                                    key={product?._id || product?.id || getProductDisplayName(product)}
                                                    className="mx-2 my-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                                {getProductDisplayName(product)}
                                                            </p>
                                                            <p className="text-xs text-slate-600 mt-1">
                                                                Available: {stock} | Minimum: {minStock}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {notificationMeta.message}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            <Icon className={`w-4 h-4 ${notificationMeta.iconClass}`} />
                                                            <span
                                                                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${notificationMeta.badgeClass}`}
                                                            >
                                                                {notificationMeta.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-3 border-t border-slate-100 bg-slate-50">
                                    <button
                                        type="button"
                                        onClick={handleOpenLowStockPage}
                                        className="w-full py-2 text-sm font-medium text-white bg-slate-900 hover:bg-black rounded-lg transition"
                                    >
                                        Open Inventory Alerts
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Logout"
                        className="text-gray-600 hover:text-red-600 transition"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
                </div>
            </nav>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-2xl p-5">
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to logout from admin panel?
                        </p>

                        <div className="mt-5 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelLogout}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
