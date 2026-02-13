import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { MenuItem } from "./DashboardLayout"; // Use type-only import

interface BottomNavProps {
  menuItems: MenuItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ menuItems }) => {
  const location = useLocation();

  // Telegram's dock usually looks best with 4-5 key actions
  const displayItems = menuItems.slice(0, 5);

  return (
    <div className="lg:hidden fixed bottom-6 left-0 right-0 z-50 px-6">
      <nav className="mx-auto max-w-105 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 h-18 rounded-[28px] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {displayItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon; // Now we can use it as a Component!

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center relative transition-all duration-300 flex-1 ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {/* Active Indicator Bar (Telegram Style) */}
              {isActive && (
                <div className="absolute -top-1 w-6 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}

              <div className={`p-2 rounded-2xl transition-all ${isActive ? "bg-blue-500/10 scale-110" : ""}`}>
                <Icon 
                  size={22} 
                  className={item.animate && !isActive ? "animate-spin" : ""} 
                />
              </div>

              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>

              {/* Notification Badge */}
              {item.badge && (
                <span className="absolute top-2 right-1/4 w-2 h-2 bg-rose-500 rounded-full border border-[#1e293b]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;