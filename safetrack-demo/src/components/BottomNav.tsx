import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { MenuItem } from "./DashboardLayout"; // Use type-only import

interface BottomNavProps {
  menuItems: MenuItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ menuItems }) => {
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-6 left-0 right-0 z-50 px-4">
      <nav className="mx-auto max-w-md bg-[#1e293b]/60 backdrop-blur-2xl border border-white/10 h-20 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        
        {/* Scrollable Container */}
        <div className="flex items-center h-full overflow-x-auto no-scrollbar px-4 gap-2 scroll-smooth">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                // flex-shrink-0 is the secret to making horizontal scroll work
                className={`flex flex-col items-center justify-center relative transition-all duration-300 min-w-[72px] flex-shrink-0 h-full ${
                  isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute top-2 w-8 h-1 bg-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                )}

                <div className={`p-2 rounded-2xl transition-all ${isActive ? "bg-blue-500/10 scale-110" : ""}`}>
                  <Icon 
                    size={22} 
                    className={item.animate && !isActive ? "animate-spin" : ""} 
                  />
                </div>

                <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>

                {/* Notification Badge */}
                {item.badge && (
                  <span className="absolute top-5 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#1e293b]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;