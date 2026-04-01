'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, User, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '@/context/context';
import { showToast } from '@/utils/toast';

export default function OnboardingFlow() {
    const { sendOtp, verifyOtp, completeRegistration, login } = useAppContext();

    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Profile, 4: Documents
    const [currentDevOtp, setCurrentDevOtp] = useState(''); // Stores the devOtp for testing
    const [tempToken, setTempToken] = useState(''); // Temp token for new user registration

    const [formData, setFormData] = useState({
        phone: '',
        otp: '',
        name: '',
        email: '',
        referralCode: '',
        licenseId: '',
        gstId: '',
    });
    const [errors, setErrors] = useState({});

    const nextStep = () => {
        setErrors({});
        setStep((prev) => prev + 1);
    };

    const handleSendOtp = async () => {
        const phoneDigits = (formData.phone || '').replace(/\D/g, '');
        if (!phoneDigits || phoneDigits.length !== 10) {
            setErrors({ phone: 'Enter a valid 10-digit mobile number' });
            return;
        }
        setErrors({});
        const data = await sendOtp(phoneDigits);

        if (data?.devOtp || data?.success) {
            setFormData((prev) => ({ ...prev, phone: phoneDigits }));
            if (data.devOtp) setCurrentDevOtp(data.devOtp);
            nextStep();
        } else {
            setErrors({ phone: data?.message || "Failed to send OTP" });
        }
    };

    // const handleVerifyOtp = async () => {
    //     // Validation: Ensure all 6 digits are entered
    //     if (formData.otp.length < 6) return alert("Please enter the full 6-digit OTP");

    //     const data = await verifyOtp(formData.phone, formData.otp);

    //     if (data?.success) {
    //         alert("Login Successful!"); // Alert confirms success before moving to details
    //         nextStep(); // Opens the Enter Details Modal (Step 3)
    const handleVerifyOtp = async () => {
        const otpDigits = (formData.otp || '').replace(/\D/g, '').slice(0, 6);
        if (otpDigits.length !== 6) {
            setErrors({ otp: 'Please enter the full 6-digit OTP' });
            return;
        }
        setErrors({});
        const phoneDigits = (formData.phone || '').replace(/\D/g, '').slice(0, 10);
        const data = await verifyOtp(phoneDigits, otpDigits);

        // Check if new user needs registration
        if (data.needsRegistration) {
            setTempToken(data.tempToken);
            setStep(3); // Move to registration step
        } else if (data.user && data.token) {
            // Existing user - login and redirect based on KYC
            login(data.token, data.user);
            if (data.user?.kyc !== "APPROVED") {
                window.location.href = '/kyc';
            } else {
                window.location.href = '/';
            }
        } else {
            showToast(data?.message || "Invalid OTP. Please check the code.", "error");
        }
    };

    const handleCompleteRegistration = async () => {
        const trimmedName = formData.name.trim();
        const trimmedEmail = formData.email.trim().toLowerCase();
        const regErrors = {};
        if (!trimmedName) regErrors.name = 'Name is required';
        if (!trimmedEmail) regErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) regErrors.email = 'Enter a valid email address';
        if (!tempToken && Object.keys(regErrors).length === 0) {
            showToast('Session expired. Please start again.', "error");
            setStep(1);
            return;
        }
        if (Object.keys(regErrors).length) {
            setErrors(regErrors);
            return;
        }
        setErrors({});

        const data = await completeRegistration(tempToken, {
            name: trimmedName,
            email: trimmedEmail,
            referralCode: formData.referralCode.trim() || undefined,
        });

        if (data.user && data.token) {
            login(data.token, data.user);
            if (data.user?.kyc !== "APPROVED") {
                window.location.href = '/kyc';
            } else {
                window.location.href = '/';
            }
        } else {
            showToast(data?.message || 'Registration failed. Please try again.', "error");
        }
    };


    const handleOtpChange = (value, index) => {
        const otpArray = formData.otp.split('');
        otpArray[index] = value;
        const newOtp = otpArray.join('');
        setFormData({ ...formData, otp: newOtp });

        // Auto-focus next input box for a smooth mobile experience
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Progress Bar Indicators */}
                <div className="bg-teal-50 px-8 py-4 flex justify-between">
                    {[1, 2, 3, 4].map((num) => (
                        <div
                            key={num}
                            className={`h-2 flex-1 mx-1 rounded-full ${step >= num ? 'bg-teal-700' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>

                <div className="p-8">
                    {/* STEP 1: Phone Number Input */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900">Welcome to Kuremedi</h2>
                                <p className="text-gray-500 mt-2">Enter your phone number to continue</p>
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    maxLength={10}
                                    value={formData.phone}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-700 outline-none transition-all ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                />
                                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                            </div>
                            <button
                                onClick={handleSendOtp}
                                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-teal-200"
                            >
                                Send OTP
                            </button>
                        </div>
                    )}

                    {/* STEP 2: OTP Verification Modal */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                                <p className="text-gray-500 mt-2">Sent to +91 {formData.phone}</p>

                                {currentDevOtp && (
                                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-mono">
                                        Dev Mode OTP: <span className="font-bold tracking-widest">{currentDevOtp}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center gap-2">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <input
                                        key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                                        className={`w-10 h-12 text-center text-lg font-bold bg-gray-50 border rounded-lg focus:border-teal-700 outline-none ${errors.otp ? 'border-red-500' : 'border-gray-200'}`}
                                        onChange={(e) => handleOtpChange(e.target.value.replace(/\D/g, ''), i)}
                                    />
                                ))}
                            </div>
                            {errors.otp && <p className="text-red-500 text-sm text-center">{errors.otp}</p>}
                            <button
                                onClick={handleVerifyOtp}
                                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-xl transition-all"
                            >
                                Verify & Continue
                            </button>
                            <button onClick={() => setStep(1)} className="w-full text-sm text-teal-700 font-medium">Change Number</button>
                        </div>
                    )}

                    {/* STEP 3: Account Profile Details */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900">Create Profile</h2>
                                <p className="text-gray-500 mt-1">Setup your account details</p>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text" placeholder="Full Name *"
                                        value={formData.name}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-teal-700 ${errors.name ? 'border-red-500' : ''}`}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email" placeholder="Email Address *"
                                        value={formData.email}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-teal-700 ${errors.email ? 'border-red-500' : ''}`}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text" placeholder="Referral Code (Optional)"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-teal-700"
                                        onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleCompleteRegistration} className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-xl transition-all">
                                Complete & Login
                            </button>
                        </div>
                    )}

                    {/* STEP 4: Documents and KYC */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
                                <p className="text-gray-500 mt-1">Upload pharma licenses to activate account</p>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Drug License ID</label>
                                    <input
                                        type="text" placeholder="Enter License Number"
                                        className="w-full mb-3 px-3 py-2 text-sm border rounded-md outline-none focus:border-teal-700"
                                    />
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                                <p className="text-xs text-gray-500">Upload License (JPEG, PNG, PDF)</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".jpg,.png,.pdf" />
                                        </label>
                                    </div>
                                </div>

                                <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">GST Identification (Optional)</label>
                                    <input
                                        type="text" placeholder="Enter GST Number"
                                        className="w-full mb-3 px-3 py-2 text-sm border rounded-md outline-none focus:border-teal-700"
                                    />
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                                <p className="text-xs text-gray-500">Upload GST or Shop Photo</p>
                                            </div>
                                            <input type="file" className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => showToast('Our team will review your docs.', "success", "Onboarding Complete")}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Submit for Approval
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
