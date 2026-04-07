import Link from "next/link";
import { ArrowLeft, Home, Search, Sparkles, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,#f0fdfa_0%,#ffffff_40%,#eef2ff_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -right-16 top-24 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative w-full overflow-hidden rounded-4xl border border-slate-200/80 bg-white/85 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-emerald-400 to-indigo-500" />

          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-8 sm:p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                <Sparkles className="h-4 w-4" />
                Page not found
              </div>

              <div className="mt-8 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Lost route
                </p>
                <h1 className="mt-4 text-6xl font-black tracking-tight text-slate-950 sm:text-7xl lg:text-8xl">
                  404
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                  The page you&apos;re looking for doesn&apos;t exist, was moved, or was typed incorrectly.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                  Use one of the shortcuts below to get back into the store quickly.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <Home className="h-4 w-4" />
                  Back to home
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Search products
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Medicine", href: "/products" },
                  { title: "Categories", href: "/categories" },
                  { title: "Support", href: "/support" },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.title}</span>
                      <ArrowLeft className="h-4 w-4 rotate-180 text-slate-400 transition group-hover:text-slate-700" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative flex items-stretch bg-slate-950 p-8 sm:p-10 lg:p-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_42%)]" />
              <div className="relative flex w-full flex-col justify-between gap-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-white shadow-2xl">
                <div>
                  <div className="flex items-center gap-3 text-sky-200">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">KureMedi</p>
                      <p className="text-xs text-slate-300">Healthcare marketplace</p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                    <p className="text-sm uppercase tracking-[0.2em] text-sky-200">Helpful reminder</p>
                    <p className="mt-3 text-2xl font-bold leading-tight text-white">
                      We couldn&apos;t find that page.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      If you followed a broken link, the fastest path is usually the home page or search.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/support"
                    className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/12"
                  >
                    Contact support
                  </Link>
                  <Link
                    href="/products"
                    className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/12"
                  >
                    Browse catalog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}