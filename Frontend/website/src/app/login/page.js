'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAppContext } from '@/context/context';
import { showToast } from '@/utils/toast';

function LoginField({ icon: Icon, error, className = '', ...props }) {
    return (
        <div>
            <div className="relative">
                {Icon ? <Icon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" /> : null}
                <input
                    {...props}
                    className={`w-full rounded-2xl border bg-white px-11 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${error ? 'border-rose-400' : 'border-slate-200'} ${className}`}
                />
            </div>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token, login, loginWithPassword } = useAppContext();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [blockedMessage, setBlockedMessage] = useState('');

    useEffect(() => {
        if (token) router.replace('/');
    }, [router, token]);

    useEffect(() => {
        if (searchParams.get('blocked') !== '1') {
            setBlockedMessage('');
            return;
        }
        let msg = 'Your account is blocked. Please contact support.';
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('blocked_message');
            if (stored) {
                msg = stored;
                sessionStorage.removeItem('blocked_message');
            }
        }
        setBlockedMessage(msg);
    }, [searchParams]);

    const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

    const handleLogin = async () => {
        const email = normalizeEmail(form.email);
        const password = String(form.password || '').trim();
        const nextErrors = {};

        if (!email) nextErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address';
        if (!password) nextErrors.password = 'Password is required';

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        try {
            setLoading(true);
            setErrors({});
            const data = await loginWithPassword(email, password);

            if (data?.token && data?.user) {
                login(data.token, data.user);
                showToast('Logged in successfully', 'success');
                router.replace(data.user?.kyc !== 'APPROVED' ? '/kyc' : '/');
                router.refresh();
                return;
            }

            throw new Error(data?.message || 'Login failed');
        } catch (error) {
            setErrors({ password: error.message || 'Invalid email or password' });
            showToast(error.message || 'Invalid email or password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
                <section className="order-2 lg:order-1">
                    <div className="max-w-xl rounded-4xl border border-white/80 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Login</p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Welcome back</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Login with your email and password. If you forget either, use recovery to reset on a separate page.
                        </p>

                        {blockedMessage ? (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                <p className="font-semibold">{blockedMessage}</p>
                                <Link href="/support" className="mt-1 inline-block text-xs font-semibold underline underline-offset-2 text-red-900">
                                    Contact Customer Support
                                </Link>
                            </div>
                        ) : null}

                        <div className="mt-7 space-y-4">
                            <LoginField
                                icon={Mail}
                                type="email"
                                autoComplete="email"
                                placeholder="Email address"
                                value={form.email}
                                error={errors.email}
                                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                            />

                            <div>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        value={form.password}
                                        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                        className={`w-full rounded-2xl border bg-white px-11 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${errors.password ? 'border-rose-400' : 'border-slate-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                    </button>
                                </div>
                                {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <Link href="/forgot-password" className="font-semibold text-amber-700 hover:text-amber-800">
                                    Forgot email or password?
                                </Link>
                                <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
                                    Create account
                                </Link>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleLogin}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
                                Login
                                <ArrowRight className="h-4.5 w-4.5" />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="order-1 rounded-4xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_70px_rgba(8,47,73,0.12)] backdrop-blur lg:order-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">Secure sign-in for returning users</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Access your account quickly with email and password. If you need help, you can create a new account from the signup page or recover access from the forgot-password page.
                    </p>
                    <div className="mt-6 grid gap-3 text-sm text-slate-700">
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">Fast login with email and password</div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">Clear navigation to signup for new users</div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">Recovery page for forgotten email or password</div>
                    </div>
                </section>
            </div>
        </div>
    );
}
