'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How do I place an order?',
    a: 'Browse products, add to cart, and proceed to checkout. Enter your delivery address and choose a payment method. For prescription medicines, upload a valid prescription when prompted.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, debit/credit cards, net banking, and wallet payments. You can also use your Kuremedi wallet balance for orders.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery timelines vary by location. Standard delivery is typically 2–5 business days. Express delivery options may be available in select areas.',
  },
  {
    q: 'Why is KYC required?',
    a: 'KYC verification is mandatory for regulated products and to ensure secure transactions. It helps us comply with applicable laws and prevent misuse.',
  },
  {
    q: 'How does the referral program work?',
    a: 'Share your referral code with friends. When they sign up and complete their first qualifying order, both you and your friend earn wallet credits as per our current referral terms.',
  },
  {
    q: 'Can I return or cancel an order?',
    a: 'Yes. You can cancel before dispatch. For returns after delivery, our return policy applies—some items like prescription medicines may have restrictions. Check order details for eligibility.',
  },
  {
    q: 'How do I contact support?',
    a: 'Go to Profile → Support to start a chat. You can also use quick topics for order, payment, wallet, or KYC queries. Our team will respond as soon as possible.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use encryption and secure protocols to protect your personal and payment information. Read our Privacy Policy for full details.',
  },
];

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState(0);

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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ</h1>
        <p className="text-sm text-gray-600 mb-8">
          Find answers to common questions about Kuremedi.
        </p>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <button
                key={index}
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-teal-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-teal-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-teal-700 shrink-0" />
                  )}
                </div>
                {isExpanded && (
                  <p className="text-gray-600 mt-3 leading-relaxed">{item.a}</p>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-500 text-center mt-8">
          Still have questions?{' '}
          <Link href="/support" className="text-teal-700 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
