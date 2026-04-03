'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Information We Collect',
    content:
      'We collect information you provide directly (name, phone, email, address), order and payment details, and information from your device such as IP address and app usage data to provide and improve our pharmacy services.',
  },
  {
    title: 'How We Use Your Information',
    content:
      'Your information is used to process orders, verify KYC, manage your wallet, send order updates, provide customer support, and improve our services. We may also use it for promotional communications if you have opted in.',
  },
  {
    title: 'Data Sharing',
    content:
      'We do not sell your personal data. We may share information with service providers (payment processors, delivery partners) strictly to fulfil your orders. We comply with applicable laws and only share when necessary.',
  },
  {
    title: 'Data Security',
    content:
      'We implement industry-standard security measures to protect your data. Sensitive information such as health-related details and payment data is encrypted and stored securely.',
  },
  {
    title: 'Your Rights',
    content:
      'You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications. Contact our support team for any privacy-related requests.',
  },
  {
    title: 'Updates',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or email. Continued use of the app after changes constitutes acceptance.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-medium mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString('en-IN')}. Kuremedi
          respects your privacy. This policy describes how we collect, use, and
          protect your information.
        </p>

        <div className="space-y-4">
          {SECTIONS.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center mt-8">
          For questions, contact us through{' '}
          <Link href="/support" className="text-teal-700 hover:underline">
            Support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
