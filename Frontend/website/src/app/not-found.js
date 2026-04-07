import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#ecfeff_0%,#ffffff_38%,#eff6ff_100%)]">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full rounded-4xl border border-sky-100 bg-white/80 p-8 shadow-[0_30px_80px_rgba(14,165,233,0.12)] backdrop-blur md:p-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                <Search className="h-4 w-4" />
                Page not found
              </div>
              <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
                404
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The page you&apos;re looking for doesn&apos;t exist, was moved, or may have been typed incorrectly.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Use the links below to get back to the main site or search for what you need.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Home className="h-4 w-4" />
                  Back to home
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Search products
                </Link>
              </div>
            </div>

            <div className="grid flex-1 gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                <p className="text-sm text-sky-200">Quick links</p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <Link href="/products" className="block transition hover:text-white">
                    Browse products
                  </Link>
                  <Link href="/categories" className="block transition hover:text-white">
                    View categories
                  </Link>
                  <Link href="/support" className="block transition hover:text-white">
                    Contact support
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-sky-500/25 via-cyan-500/10 to-transparent p-5">
                <p className="text-sm text-sky-200">Need help?</p>
                <h2 className="mt-2 text-xl font-bold">We can point you in the right direction.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  If this link came from somewhere on the site, let us know and we&apos;ll fix it.
                </p>
                <Link
                  href="/support"
                  className="mt-5 inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-50"
                >
                  Open support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}