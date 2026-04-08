import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#ecfeff_0%,#f8fafc_42%,#ffffff_100%)] px-4 py-12">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-[0_18px_40px_rgba(16,185,129,0.14)] md:p-10 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-emerald-600"
          >
            <path
              d="M20 7L9 18L4 13"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-900">Order Confirmed</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 md:text-base">
          Your payment was successful and your order has been placed. You can track order status from your orders page.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/orders"
            className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 sm:w-auto"
          >
            View My Orders
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
