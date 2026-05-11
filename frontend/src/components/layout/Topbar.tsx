import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layers3, Sparkles, FolderKanban, MoonStar, SunMedium } from "lucide-react";

const navItems = [
  { to: "/showcases", label: "Showcases", icon: Sparkles },
  { to: "/collections", label: "Collections", icon: FolderKanban },
];

export function Topbar() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:px-5 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 text-white shadow-lg shadow-fuchsia-500/20">
            <Layers3 className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              WebInsp
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Curate references. Build collections.
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}