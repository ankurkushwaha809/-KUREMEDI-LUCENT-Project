 'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/context';
import { ClipboardList, Search, X } from 'lucide-react';
import Image from 'next/image';
import * as api from '@/api';
import { formatOrderNumber, getOrderProgressLabel, getOrderStatusClasses, normalizeOrderStatus } from '@/utils/orders';

export default function Header() {
    const router = useRouter();
    const historyRef = useRef(null);
    const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
    const [orderHistory, setOrderHistory] = useState([]);
    const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
    const [orderHistoryError, setOrderHistoryError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { cartItems, wishlistItems, user, token } = useAppContext();
    const cartCount = cartItems?.reduce((s, i) => s + (i.qty || 0), 0) ?? 0;
    const wishlistCount = wishlistItems?.length ?? 0;

    const loadOrderHistory = useCallback(async () => {
        if (!token) return;
        setOrderHistoryLoading(true);
        setOrderHistoryError('');
        try {
            const data = await api.getMyOrders();
            setOrderHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            setOrderHistory([]);
            setOrderHistoryError('Unable to load order history');
        } finally {
            setOrderHistoryLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!isOrderHistoryOpen) return;
        loadOrderHistory();
    }, [isOrderHistoryOpen, loadOrderHistory]);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (!historyRef.current) return;
            if (!historyRef.current.contains(event.target)) {
                setIsOrderHistoryOpen(false);
            }
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOrderHistoryOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    const recentOrders = orderHistory.slice(0, 3);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4 md:gap-8">

                    {/* 1. LEFT: Logo */}
                    <Link href="/" className="flex items-center gap-3 shrink-0 group">
                        <div>
                            <Image src="/Kure.png" width={200} height={20} alt="Scaleten" />
                        </div>
                        
                    </Link>

                    {/* 2. CENTER: Circular Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-xl relative items-center">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.push(searchQuery.trim() ? `/search?q=${encodeURIComponent(searchQuery.trim())}` : '/search');
                            }}
                            className="w-full relative"
                        >
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search medicines, health products..."
                                className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-100 rounded-full transition-all outline-none text-sm"
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </form>
                    </div>

                    {/* 3. RIGHT: Actions (Cart, Wishlist, Login) */}
                    <div className="flex items-center gap-2 md:gap-5">

                        <div className="relative" ref={historyRef}>
                            <button
                                type="button"
                                onClick={() => setIsOrderHistoryOpen((prev) => !prev)}
                                className="relative p-2 text-gray-600 hover:text-teal-700 transition-colors"
                                aria-label="Open order history"
                                aria-expanded={isOrderHistoryOpen}
                            >
                                <ClipboardList className="w-6 h-6" />
                            </button>

                            {isOrderHistoryOpen && (
                                <div className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden z-50">
                                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Order history</p>
                                            <p className="text-xs text-gray-500">Recent delivery updates</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsOrderHistoryOpen(false)}
                                            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                            aria-label="Close order history"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="max-h-88 overflow-y-auto p-3 space-y-3">
                                        {!token ? (
                                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                                                <p className="text-sm font-medium text-gray-700">Login to view your order history.</p>
                                                <Link
                                                    href="/login"
                                                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
                                                >
                                                    Login
                                                </Link>
                                            </div>
                                        ) : orderHistoryLoading ? (
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500">
                                                Loading order history...
                                            </div>
                                        ) : orderHistoryError ? (
                                            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                                                {orderHistoryError}
                                            </div>
                                        ) : recentOrders.length === 0 ? (
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500">
                                                No orders yet.
                                            </div>
                                        ) : (
                                            recentOrders.map((order) => {
                                                const status = normalizeOrderStatus(order.status);
                                                const items = Array.isArray(order.items) ? order.items : [];
                                                const firstItemNames = items.slice(0, 2).map((item) => item?.productName || 'Ordered product').join(', ');
                                                const extraCount = Math.max(0, items.length - 2);

                                                return (
                                                    <div key={order._id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900">Order #{formatOrderNumber(order._id)}</p>
                                                                <p className="mt-1 text-xs text-gray-500">{firstItemNames || 'Ordered product'}</p>
                                                            </div>
                                                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getOrderStatusClasses(status)}`}>
                                                                {getOrderProgressLabel(status)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent order'}
                                                            {extraCount > 0 ? ` • +${extraCount} more` : ''}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100 bg-gray-50 p-3">
                                        <Link
                                            href="/ordered-products"
                                            onClick={() => setIsOrderHistoryOpen(false)}
                                            className="flex items-center justify-between rounded-2xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
                                        >
                                            <span>View ordered products</span>
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Wishlist */}
                        <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-teal-700 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {wishlistCount > 0 && (
                                <span className="absolute top-1 right-1 bg-teal-700 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{wishlistCount}</span>
                            )}
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2 text-gray-600 hover:text-teal-700 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-teal-700 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>
                            )}
                        </Link>

                        {/* Login / Profile */}
                        <Link
                            href={token ? "/profile" : "/login"}
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white rounded-full hover:bg-teal-800 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{token ? (user?.name || "Profile") : "Login"}</span>
                        </Link>

                        {/* Mobile Toggle */}

                        <Link
                            href={token ? "/profile" : "/login"}
                            className="lg:hidden p-2 text-gray-700 md:hidden"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Mobile Search - Visible only on mobile below main header */}
                <div className="mt-3 md:hidden">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.push(searchQuery.trim() ? `/search?q=${encodeURIComponent(searchQuery.trim())}` : '/search');
                        }}
                        className="relative"
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search medicines..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </form>
                </div>
            </div>
        </header>
    );
}