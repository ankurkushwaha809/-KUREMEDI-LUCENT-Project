import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#ffffff_44%,#eef2ff_100%)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <Search size={16} />
              Page not found
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
              404
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
              The route you opened does not exist in the admin panel. Use the links below to return to a valid screen.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Home size={16} />
                Go to dashboard
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                <ArrowLeft size={16} />
                Go to login
              </Link>
            </div>
          </div>

          <div className="bg-slate-950 p-8 sm:p-10 lg:p-12 text-white flex flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Helpful links</p>
              <div className="mt-6 space-y-3 text-sm text-slate-200">
                <Link to="/" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10">
                  Dashboard home
                </Link>
                <Link to="/login" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10">
                  Admin login
                </Link>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/25 via-sky-500/10 to-transparent p-5">
              <p className="text-sm text-indigo-200">Need support?</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                If you expected this route to exist, check the URL or update the navigation link.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;