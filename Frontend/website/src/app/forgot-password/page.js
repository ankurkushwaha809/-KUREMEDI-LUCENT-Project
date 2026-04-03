'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, Phone } from 'lucide-react';
import { useAppContext } from '@/context/context';
import { showToast } from '@/utils/toast';

function Field({ icon: Icon, error, className = '', ...props }) {
    return (
        <div>
            <div className="relative">
                {Icon ? <Icon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" /> : null}
                <input
                    {...props}
                    className={`w-full rounded-2xl border bg-white px-11 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-600 focus:ring-4 focus:ring-amber-100 ${error ? 'border-rose-400' : 'border-slate-200'} ${className}`}
                />
            </div>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        </div>
    );
}

function OtpInputs({ value, onChange, error }) {
    const digits = String(value || '').padEnd(6, ' ').slice(0, 6).split('');

    const handleChange = (nextValue, index) => {
        const nextDigits = String(value || '').padEnd(6, ' ').slice(0, 6).split('');
        nextDigits[index] = nextValue;
        onChange(nextDigits.join('').replace(/\s/g, ''));
        if (nextValue && index < 5) {
            const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    return (
        <div>
            <div className="flex justify-between gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                        key={index}
                        id={`forgot-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digits[index] === ' ' ? '' : digits[index]}
                        onChange={(event) => handleChange(event.target.value.replace(/\D/g, '').slice(0, 1), index)}
                        className={`h-14 w-12 rounded-2xl border bg-white text-center text-lg font-bold text-slate-900 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-100 ${error ? 'border-rose-400' : 'border-slate-200'}`}
                    />
                ))}
            </div>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        </div>
    );
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { token, login, sendPasswordResetOtp, verifyPasswordResetOtp, completePasswordReset } = useAppContext();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [errors, setErrors] = useState({});
    const [recovered, setRecovered] = useState(null);
    const [form, setForm] = useState({
        phone: '',
        otp: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (token) router.replace('/');
    }, [router, token]);

    const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
    const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

    const onSendOtp = async () => {
        const phone = normalizePhone(form.phone);
        if (phone.length !== 10) {
            setErrors({ phone: 'Enter a valid registered mobile number' });
            return;
        }

        try {
            setLoading(true);
            setErrors({});
            const data = await sendPasswordResetOtp(phone);
            setForm((prev) => ({ ...prev, phone }));
            setStep(2);
            showToast(data?.message || 'OTP sent to your number', 'success');
        } catch (error) {
            setErrors({ phone: error.message || 'Could not send OTP' });
            showToast(error.message || 'Could not send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const onVerifyOtp = async () => {
        const otp = String(form.otp || '').replace(/\D/g, '').slice(0, 6);
        if (otp.length !== 6) {
            setErrors({ otp: 'Enter the 6-digit OTP' });
            return;
        }

        try {
            setLoading(true);
            setErrors({});
            const data = await verifyPasswordResetOtp(normalizePhone(form.phone), otp);
            setTempToken(data?.tempToken || '');
            setRecovered(data?.user || null);
            setForm((prev) => ({ ...prev, email: data?.user?.email || prev.email || '' }));
            setStep(3);
        } catch (error) {
            setErrors({ otp: error.message || 'OTP verification failed' });
            showToast(error.message || 'OTP verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const onUpdateAccount = async () => {
        const email = normalizeEmail(form.email);
        const password = String(form.password || '').trim();
        const confirmPassword = String(form.confirmPassword || '').trim();
        const nextErrors = {};

        if (!tempToken) nextErrors.otp = 'Session expired. Verify OTP again.';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address';
        if (!password) nextErrors.password = 'New password is required';
        else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        try {
            setLoading(true);
            setErrors({});
            const data = await completePasswordReset(tempToken, { password, email: email || undefined });
            if (data?.token && data?.user) {
                login(data.token, data.user);
                showToast('Password updated successfully', 'success');
                router.replace(data.user?.kyc !== 'APPROVED' ? '/kyc' : '/');
                router.refresh();
                return;
            }
            throw new Error(data?.message || 'Update failed');
        } catch (error) {
            setErrors({ password: error.message || 'Update failed' });
            showToast(error.message || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_40%),linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl rounded-4xl border border-white/80 bg-white/90 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Recovery</p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Recover account</h1>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Step {step}/3</div>
                </div>

                <div className="mt-3 flex gap-2">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                </div>

                <div className="mt-7 space-y-5">
                    {step === 1 ? (
                        <>
                            <Field icon={Phone} type="tel" inputMode="numeric" maxLength={10} placeholder="Registered mobile number" value={form.phone} error={errors.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: normalizePhone(event.target.value) }))} />
                            <button onClick={onSendOtp} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-70">
                                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
                                Send OTP
                                <ArrowRight className="h-4.5 w-4.5" />
                            </button>
                        </>
                    ) : null}

                    {step === 2 ? (
                        <>
                            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                                OTP sent to +91 {form.phone}
                            </div>
                            <OtpInputs value={form.otp} error={errors.otp} onChange={(otp) => setForm((prev) => ({ ...prev, otp }))} />
                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Change number</button>
                                <button onClick={onVerifyOtp} disabled={loading} className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-70">Verify OTP</button>
                            </div>
                        </>
                    ) : null}

                    {step === 3 ? (
                        <>
                            {recovered?.email ? <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">Account found. You can keep or update email.</div> : null}
                            <Field icon={Mail} type="email" placeholder="Email (optional update)" value={form.email} error={errors.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />

                            <div>
                                <div className="relative">
                                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="New password"
                                        value={form.password}
                                        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                        className={`w-full rounded-2xl border bg-white px-11 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-600 focus:ring-4 focus:ring-amber-100 ${errors.password ? 'border-rose-400' : 'border-slate-200'}`}
                                    />
                                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                    </button>
                                </div>
                                {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
                            </div>

                            <Field type="password" placeholder="Confirm new password" value={form.confirmPassword} error={errors.confirmPassword} onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} />

                            <button onClick={onUpdateAccount} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-70">
                                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
                                Update account
                                <CheckCircle2 className="h-4.5 w-4.5" />
                            </button>
                        </>
                    ) : null}
                </div>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Back to{' '}
                    <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800">Login</Link>
                    {' '}or{' '}
                    <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">Signup</Link>
                </p>
            </div>
        </div>
    );
}
