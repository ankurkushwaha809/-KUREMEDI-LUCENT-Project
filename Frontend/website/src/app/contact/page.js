import Link from "next/link";
import { Mail, Phone, MessageCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Contact Us | Kure Medi",
  description: "Get in touch with Kure Medi support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_40%,#ffffff_100%)] px-4 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-[0_24px_70px_rgba(15,118,110,0.12)]">
          <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-6 py-10 text-white sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-50/80">Contact</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Reach our support team</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50/90 sm:text-base">
              Use this page for customer support, order help, and account questions. If you need a faster response,
              go straight to the support ticket page.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-10">
            <a
              href="mailto:support@kuremedi.com"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-teal-200 hover:bg-teal-50"
            >
              <Mail className="h-6 w-6 text-teal-700" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Email</p>
              <p className="mt-1 text-sm text-slate-600">support@kuremedi.com</p>
            </a>

            <a
              href="tel:+918527846863"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-teal-200 hover:bg-teal-50"
            >
              <Phone className="h-6 w-6 text-teal-700" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Phone</p>
              <p className="mt-1 text-sm text-slate-600">+91 85278 46863</p>
            </a>

            <Link
              href="/support"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-teal-200 hover:bg-teal-50"
            >
              <MessageCircle className="h-6 w-6 text-teal-700" />
              <p className="mt-4 text-sm font-semibold text-slate-900">Support tickets</p>
              <p className="mt-1 text-sm text-slate-600">Create a ticket and track replies</p>
            </Link>
          </div>

          <div className="border-t border-slate-100 px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Need help with an order?</p>
                <p className="text-sm text-slate-600">Open a ticket so the team can see your account and order details.</p>
              </div>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
              >
                Go to support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
