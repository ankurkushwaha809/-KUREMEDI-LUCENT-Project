'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/context';
import { Search } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { cartItems, wishlistItems, user, token } = useAppContext();
    const cartCount = cartItems?.reduce((s, i) => s + (i.qty || 0), 0) ?? 0;
    const wishlistCount = wishlistItems?.length ?? 0;

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


                        {/* <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-700 hover:text-teal-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button> */}
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

                {/* Mobile Drawer */}
                {/* {isMenuOpen && (
                    <nav className="md:hidden mt-4 pb-4 border-t pt-4 animate-in slide-in-from-top duration-200">
                        <div className="flex flex-col gap-2">
                            <Link href="/products" className="px-2 py-3 text-gray-700 font-medium">All Products</Link>
                            <Link href="/about" className="px-2 py-3 text-gray-700 font-medium">About Company</Link>
                            <Link href="/contact" className="px-2 py-3 text-gray-700 font-medium">Contact Support</Link>
                            <Link href="/login" className="mt-2 flex justify-center items-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-full font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Login / Register
                            </Link>
                        </div>
                    </nav>
                )} */}
            </div>
        </header>
    );
}