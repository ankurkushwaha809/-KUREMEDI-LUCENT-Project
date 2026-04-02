'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Phone, Mail } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://www.apple.com/app-store/';
    const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store';

    return (
        <footer className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white overflow-hidden">

            {/* Background Decorative Elements (Optional glow effects) */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-6 pt-16 pb-8 relative z-10">

                {/* Top Section: Split Layout (Brand vs App) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">

                    {/* Left: Branding & Trust */}
                    <div className="space-y-6 text-center lg:text-left">
                        <div>
                            <Image src="/Kure.png" width={200} height={20} alt="Scaleten" />
                            <p className="text-teal-200 font-medium text-lg flex items-center justify-center lg:justify-start gap-2">
                                <span className="w-8 h-[1px] bg-teal-400/50 inline-block"></span>
                                Pharmaceutical Excellence
                            </p>
                        </div>
                        <p className="text-gray-300 max-w-md mx-auto lg:mx-0 leading-relaxed">
                            Your trusted partner in pharmaceutical excellence. We bring the pharmacy to your fingertips with safety, speed, and reliability.
                        </p>

                        {/* Contact Minified */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-400 pt-2">
                            <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-white transition-colors">
                                <Phone className="w-4 h-4" /> Support
                            </a>
                            <a href="mailto:info@scaleten.com" className="flex items-center gap-2 hover:text-white transition-colors">
                                <Mail className="w-4 h-4" /> Email Us
                            </a>
                        </div>
                    </div>

                    {/* Right: The Hero App Section (Glassmorphism Card) */}
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-10 text-center lg:text-right shadow-2xl">
                        <h3 className="text-2xl font-bold mb-3">Download the Scaleten App</h3>
                        <p className="text-gray-300 mb-8 text-sm">Get exclusive offers and track your medicines in real-time.</p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                            {/* App Store Button */}
                            <a
                                href={appStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl transition-all hover:scale-105 shadow-lg border border-white/10"
                            >
                                <Image src="/appstore.png" alt="App Store" width={32} height={32} className="w-8 h-8" />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-medium text-gray-400 group-hover:text-gray-300">Download on the</div>
                                    <div className="text-sm font-bold leading-none">App Store</div>
                                </div>
                            </a>

                            {/* Play Store Button */}
                            <a
                                href={playStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl transition-all hover:scale-105 shadow-lg border border-white/10"
                            >
                                <Image src="/playstore.png" alt="Play Store" width={32} height={32} className="w-8 h-8" />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-medium text-gray-400 group-hover:text-gray-300">Get it on</div>
                                    <div className="text-sm font-bold leading-none">Google Play</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent mb-8" />

                {/* Bottom Section: Certifications & Legal */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6">

                    {/* Copyright & Legal Links */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <p className="text-sm text-gray-500">
                            © {currentYear} Kure Medi. All rights reserved.
                        </p>
                        <div className="flex gap-4 text-sm">
                            <Link href="/privacy-policy" className="text-teal-300/90 hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms-and-conditions" className="text-teal-300/90 hover:text-white transition-colors">
                                Terms & Conditions
                            </Link>
                            <Link href="/faq" className="text-teal-300/90 hover:text-white transition-colors">
                                FAQ
                            </Link>
                        </div>
                    </div>

                    {/* Trust Badges (Simplified) */}
                    <div className="flex gap-6 text-xs font-semibold text-teal-300/80 tracking-wide uppercase">
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> FDA Approved
                        </span>
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> ISO 9001:2015
                        </span>
                        <span className="hidden sm:flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> WHO-GMP
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}