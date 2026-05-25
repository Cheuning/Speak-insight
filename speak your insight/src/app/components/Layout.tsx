import { Outlet, NavLink } from "react-router";
import { Pen, CalendarDays } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#3D3B38] font-sans flex justify-center">
      {/* Notebook Wrapper */}
      <div className="w-full max-w-lg bg-[#FAF8F5] min-h-screen shadow-[0_0_40px_rgba(0,0,0,0.05)] relative flex flex-col border-x border-[#EAE5DA]">
        {/* Binder Holes (Decoration) */}
        <div className="absolute left-4 top-0 bottom-0 w-8 flex flex-col justify-around py-20 opacity-40 pointer-events-none hidden sm:flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full bg-[#E5DFD3] shadow-inner border border-[#D5CFC3]" />
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pt-8 pb-28 relative z-10">
          <div className="px-6 py-6 sm:px-12">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(140,135,126,0.15)] border border-[#EAE5DA] p-2 flex items-center justify-between z-50">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-colors ${
                isActive ? "text-[#8A6D52] bg-[#F7F2EB]" : "text-[#A39E93] hover:text-[#8A6D52]"
              }`
            }
          >
            <Pen size={20} />
            <span className="text-xs mt-1 font-sans">기록하기</span>
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-colors ${
                isActive ? "text-[#8A6D52] bg-[#F7F2EB]" : "text-[#A39E93] hover:text-[#8A6D52]"
              }`
            }
          >
            <CalendarDays size={20} />
            <span className="text-xs mt-1 font-sans">모아보기</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
