import { Outlet } from "react-router-dom";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="absolute right-[-5%] top-[10%] h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-400/20" />
        <div className="absolute bottom-[-10%] left-[25%] h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative z-10">
        <Topbar />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}