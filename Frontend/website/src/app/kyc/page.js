'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAppContext } from '@/context/context';
import * as api from '@/api';
import { showToast } from '@/utils/toast';

// Wrap useSearchParams usage in Suspense so Next.js prerender/export is happy
export default function KycPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading KYC...</div>}>
      <KycPageInner />
    </Suspense>
  );
}

function KycPageInner() {
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { user, token, refreshUser } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Text Fields State
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // File Fields State
  const [drugLicenseFile, setDrugLicenseFile] = useState(null);
  const [gstFile, setGstFile] = useState(null);
  const [shopPhotoFile, setShopPhotoFile] = useState(null);
  const [cancelChequeFile, setCancelChequeFile] = useState(null);
  const isKycPending = user?.kyc === 'PENDING';

  const getErrorMessage = (error) => {
    const fromData = error?.data?.message;
    const fromResponse = error?.response?.data?.message;
    const fromMessage = error?.message;
    const msg = fromData || fromResponse || fromMessage;
    if (!msg) return 'Failed to submit KYC. Please try again.';

    if (/networkerror|failed to fetch|network request failed|load failed|network error/i.test(String(msg))) {
      return 'Unable to submit KYC right now. Please check internet, ensure each document is under 5MB, then retry. If issue continues, contact support.';
    }

    return String(msg);
  };

  const validateKycFile = (file, label) => {
    if (!file) return `${label} is required`;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `${label} must be PDF, JPG, or PNG format`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `${label} is too large. Max allowed size is ${MAX_FILE_SIZE_MB}MB`;
    }
    return '';
  };

  const handleFileChange = ({ file, fieldKey, setFile, label, required }) => {
    setSubmitError('');

    if (!file) {
      setFile(null);
      if (required) {
        setErrors((p) => ({ ...p, [fieldKey]: `${label} is required` }));
      } else {
        setErrors((p) => ({ ...p, [fieldKey]: '' }));
      }
      return;
    }

    const validationMessage = validateKycFile(file, label);
    if (validationMessage) {
      setFile(null);
      setErrors((p) => ({ ...p, [fieldKey]: validationMessage }));
      return;
    }

    setFile(file);
    setErrors((p) => ({ ...p, [fieldKey]: '' }));
  };

  // Authentication Check
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please login to access KYC</p>
          <Link href="/login" className="inline-block bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-800">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Already Approved Check
  if (user.kyc === 'APPROVED') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12">
        <Link href="/profile" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">KYC Approved</h2>
          <p className="text-gray-500 mt-2 text-center">Your KYC verification is complete.</p>
        </div>
      </div>
    );
  }

  // Pending Check - block page with fixed popup until admin decision
  if (user.kyc === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Link href="/profile" className="p-1 -ml-1 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-7 h-7" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">KYC Verification</h1>
          </div>
        </div>

        <div className="mx-auto max-w-xl px-4 pt-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold text-amber-900">Documents submitted successfully</p>
            <p className="mt-1 text-sm text-amber-800">Please wait for admin approval. Your KYC form is locked until the review is completed.</p>
          </div>
        </div>

        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <ShieldAlert className="h-7 w-7 text-amber-700" />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-900">KYC Submitted</h2>
            <p className="mt-3 text-center text-sm text-gray-600 leading-relaxed">
              Your documents are under admin review. KYC form is locked right now.
              You can submit again only if admin rejects your request.
            </p>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-center text-sm font-medium text-amber-800">
                Please wait for admin approval.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href="/"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Go to Home
              </Link>
              <Link
                href="/profile"
                className="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-teal-800"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (isKycPending) {
      showToast('KYC already submitted. Please wait for admin approval.', 'info');
      return;
    }
    const err = {};
    if (!drugLicenseNumber.trim()) err.drugLicenseNumber = 'Drug license number is required';
    if (!drugLicenseFile) err.drugLicenseFile = 'Upload drug license document (required)';
    if (!bankName.trim()) err.bankName = 'Bank name is required';
    if (!accountHolderName.trim()) err.accountHolderName = 'Account holder name is required';
    if (!accountNumber.trim()) err.accountNumber = 'Account number is required';
    if (!ifscCode.trim()) err.ifscCode = 'IFSC code is required';
    if (!cancelChequeFile) err.cancelChequeFile = 'Cancel cheque / passbook document is required';

    if (drugLicenseFile) {
      const msg = validateKycFile(drugLicenseFile, 'Drug license document');
      if (msg) err.drugLicenseFile = msg;
    }
    if (gstFile) {
      const msg = validateKycFile(gstFile, 'GST certificate');
      if (msg) err.gstFile = msg;
    }
    if (shopPhotoFile) {
      const msg = validateKycFile(shopPhotoFile, 'Shop photo');
      if (msg) err.shopPhotoFile = msg;
    }
    if (cancelChequeFile) {
      const msg = validateKycFile(cancelChequeFile, 'Cancel cheque / passbook');
      if (msg) err.cancelChequeFile = msg;
    }

    if (Object.keys(err).length) {
      setErrors(err);
      setSubmitError('Please fix the highlighted fields and submit again.');
      return;
    }
    setErrors({});
    try {
      setLoading(true);
      const formData = new FormData();

      // Append Text Data
      formData.append('drugLicenseNumber', drugLicenseNumber.trim());
      formData.append('gstNumber', gstNumber.trim());
      formData.append('bankName', bankName.trim());
      formData.append('accountHolderName', accountHolderName.trim());
      formData.append('accountNumber', accountNumber.trim());
      formData.append('ifscCode', ifscCode.trim());

      // Append Files – field names must match backend
      if (drugLicenseFile) formData.append('drugLicenseDoc', drugLicenseFile);
      if (gstFile) formData.append('gstDoc', gstFile);
      if (shopPhotoFile) formData.append('shopImage', shopPhotoFile);
      if (cancelChequeFile) formData.append('cancelChequeDoc', cancelChequeFile);

      await api.submitKyc(formData);
      await refreshUser();

      showToast('KYC submitted successfully. Status: Pending.', "success");

      if (redirect === 'checkout') {
        router.push('/checkout');
      } else {
        router.push('/');
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setSubmitError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/profile" className="p-1 -ml-1 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-7 h-7" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">KYC Verification</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6">
        <p className="text-gray-600 text-sm mb-6">
          Retailer KYC: drug license, GST, shop photo and bank details with cancel cheque. Ensure documents are clear.
        </p>

        {submitError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-800">KYC submission failed</p>
            <p className="mt-1 text-sm text-red-700">{submitError}</p>
          </div>
        ) : null}

        <div className="space-y-6 mb-6">

          {/* Drug License Section */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">Drug License Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Enter drug license number"
              value={drugLicenseNumber}
              onChange={(e) => { setDrugLicenseNumber(e.target.value); setErrors((p) => ({ ...p, drugLicenseNumber: '' })); }}
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all ${errors.drugLicenseNumber ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.drugLicenseNumber && <p className="text-red-500 text-sm mt-1">{errors.drugLicenseNumber}</p>}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Drug License <span className="text-red-500">*</span></label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange({
                  file: e.target.files?.[0],
                  fieldKey: 'drugLicenseFile',
                  setFile: setDrugLicenseFile,
                  label: 'Drug license document',
                  required: true,
                })}
                className={"w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer " + (errors.drugLicenseFile ? "ring-2 ring-red-500 rounded-lg border-red-500" : "")}
              />
              {errors.drugLicenseFile && <p className="text-red-500 text-sm mt-1">{errors.drugLicenseFile}</p>}
            </div>
          </div>

          {/* GST Section */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
            <input
              type="text"
              placeholder="Enter GST number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all"
            />

            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload GST Certificate</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange({
                  file: e.target.files?.[0],
                  fieldKey: 'gstFile',
                  setFile: setGstFile,
                  label: 'GST certificate',
                  required: false,
                })}
                className="w-full text-sm text-gray-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100 cursor-pointer"
              />
              {errors.gstFile && <p className="text-red-500 text-sm mt-1">{errors.gstFile}</p>}
            </div>
          </div>

          {/* Shop Photo Section */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Shop Photo</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange({
                file: e.target.files?.[0],
                fieldKey: 'shopPhotoFile',
                setFile: setShopPhotoFile,
                label: 'Shop photo',
                required: false,
              })}
              className="w-full text-sm text-gray-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100 cursor-pointer"
            />
            {errors.shopPhotoFile && <p className="text-red-500 text-sm mt-1">{errors.shopPhotoFile}</p>}
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Bank Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. SBI, HDFC"
                  value={bankName}
                  onChange={(e) => { setBankName(e.target.value); setErrors((p) => ({ ...p, bankName: '' })); }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent ${errors.bankName ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="As per bank account"
                  value={accountHolderName}
                  onChange={(e) => { setAccountHolderName(e.target.value); setErrors((p) => ({ ...p, accountHolderName: '' })); }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent ${errors.accountHolderName ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Bank account number"
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value); setErrors((p) => ({ ...p, accountNumber: '' })); }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent ${errors.accountNumber ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => { setIfscCode(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, ifscCode: '' })); }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent uppercase ${errors.ifscCode ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.ifscCode && <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>}
              </div>
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancel Cheque / Passbook <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange({
                    file: e.target.files?.[0],
                    fieldKey: 'cancelChequeFile',
                    setFile: setCancelChequeFile,
                    label: 'Cancel cheque / passbook',
                    required: true,
                  })}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-teal-50 file:text-teal-700
                    hover:file:bg-teal-100 cursor-pointer"
                />
                {errors.cancelChequeFile && <p className="text-red-500 text-sm mt-1">{errors.cancelChequeFile}</p>}
              </div>
            </div>
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit KYC'}
        </button>
      </form>
    </div>
  );
}
