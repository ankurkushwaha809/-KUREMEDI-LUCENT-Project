'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://www.apple.com/app-store/';
    const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store';

    const companyLinks = [
        { href: '/categories', label: 'Categories' },
        { href: '/brands', label: 'Top Brands' },
        { href: '/products', label: 'All Products' },
        { href: '/faq', label: 'FAQ' },
    ];

    const supportLinks = [
        { href: '/support', label: 'Customer Support' },
        { href: '/privacy-policy', label: 'Privacy Policy' },
        { href: '/terms-and-conditions', label: 'Terms & Conditions' },
        { href: '/contact', label: 'Contact Us' },
    ];

    return (
        <footer className="border-t border-slate-200 bg-slate-50 text-slate-700">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
                    <div className="space-y-2">
                        <Image src="/Kure.png" width={170} height={52} alt="Scaleten" className="h-9 w-auto" />
                        <p className="max-w-md text-sm leading-6 text-slate-600">
                            Bulk medicine ordering made simple for modern pharmacies.
                        </p>
                        <div className="space-y-1 text-sm">
                            <a href="tel:+1234567890" className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900">
                                <Phone className="h-4 w-4" /> +1 234 567 890
                            </a>
                            <a href="mailto:info@scaleten.com" className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900">
                                <Mail className="h-4 w-4" /> info@scaleten.com
                            </a>
                            <p className="flex items-center gap-2 text-slate-500">
                                <MapPin className="h-4 w-4" /> Pan India delivery support
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quick Links</p>
                        <div className="space-y-0.5">
                            {companyLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                                >
                                    <span>{item.label}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Support</p>
                        <div className="space-y-0.5">
                            {supportLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                                >
                                    <span>{item.label}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>

                        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                            <a
                                href={appStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700 transition-colors hover:border-slate-300"
                            >
                                <Image src="/appstore.png" alt="App Store" width={28} height={28} className="h-7 w-7" />
                                <span className="text-xs font-medium">App Store</span>
                            </a>
                            <a
                                href={playStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700 transition-colors hover:border-slate-300"
                            >
                                <Image src="/playstore.png" alt="Google Play" width={28} height={28} className="h-7 w-7" />
                                <span className="text-xs font-medium">Google Play</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="my-3 h-px bg-slate-200" />

                <div className="flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                    <p>© {currentYear} Kure Medi. All rights reserved.</p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/privacy-policy" className="transition-colors hover:text-slate-900">Privacy Policy</Link>
                        <Link href="/terms-and-conditions" className="transition-colors hover:text-slate-900">Terms & Conditions</Link>
                        <Link href="/faq" className="transition-colors hover:text-slate-900">FAQ</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}