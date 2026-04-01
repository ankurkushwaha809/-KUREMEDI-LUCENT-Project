'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content:
      'By using the Kuremedi app and website, you agree to these Terms and Conditions. If you do not agree, please do not use our services. We reserve the right to modify these terms at any time.',
  },
  {
    title: 'Eligibility',
    content:
      'You must be at least 18 years of age to use our services. You must provide accurate information during registration and KYC verification. Use is limited to individuals who can legally enter into binding contracts.',
  },
  {
    title: 'Account & KYC',
    content:
      'You are responsible for maintaining the confidentiality of your account. KYC verification is required to access certain features. You agree to provide genuine identity and address proofs as required by applicable regulations.',
  },
  {
    title: 'Orders & Payments',
    content:
      'All orders are subject to availability. Prices and taxes are as displayed at checkout. Payment must be made through supported methods. We reserve the right to cancel orders in case of fraud or policy violations.',
  },
  {
    title: 'Returns & Refunds',
    content:
      'Returns and refunds are subject to our return policy and applicable regulations. Prescription medicines may have different return rules. Please refer to individual product and order details for eligibility.',
  },
  {
    title: 'Prohibited Use',
    content:
      'You must not misuse our services for illegal purposes, falsify prescriptions, resell products commercially without authorization, or attempt to circumvent security measures. Violations may result in account suspension.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'Kuremedi shall not be liable for any indirect, incidental, or consequential damages arising from use of the app or services. Our liability is limited to the amount paid for the specific order in question.',
  },
];

export default function TermsAndConditionsPage() {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Terms & Conditions
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Please read these Terms and Conditions carefully before using the
          Kuremedi app and website.
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
          For queries, reach us via{' '}
          <Link href="/support" className="text-teal-700 hover:underline">
            Support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
