'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/context/context';
import * as api from '@/api';
import { showToast } from '@/utils/toast';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, token, refreshUser } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please login to edit profile</p>
          <Link href="/login" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      showToast('Name is required', 'error');
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast('Enter a valid email address', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.updateProfile({ name: trimmedName, email: trimmedEmail || undefined });
      await refreshUser();
      showToast('Profile updated successfully');
      router.push('/profile');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/profile" className="p-1 -ml-1 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-7 h-7" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-xl mx-auto px-4 py-6">
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
