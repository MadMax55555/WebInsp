import { Link } from "react-router-dom";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 dark:bg-[#07111f]">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200/80 bg-white/80 p-8 text-center shadow-xl shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/10">
        <div className="mx-auto inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
          404 error
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The page you requested does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}