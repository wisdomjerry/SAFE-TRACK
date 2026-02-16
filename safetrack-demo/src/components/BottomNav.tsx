import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { MenuItem } from "./DashboardLayout";
import { RefreshCw } from "lucide-react";

interface BottomNavProps {
  menuItems: MenuItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ menuItems }) => {
  const location = useLocation();

  // Split menu items to place the Action Button in the center
  const half = Math.ceil(menuItems.length / 2);
  const leftItems = menuItems.slice(0, half);
  const rightItems = menuItems.slice(half);

  return (
    <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-50">
      <nav className="bg-slate-900/95 backdrop-blur-xl border border-white/10 h-20 rounded-[2.5rem] shadow-2xl shadow-blue-900/40 flex items-center justify-around px-2 relative">
        
        {/* LEFT ITEMS */}
        <div className="flex flex-1 justify-around items-center">
          {leftItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={location.pathname.startsWith(item.path)} />
          ))}
        </div>

        {/* CENTER ACTION BUTTON */}
        <div className="relative -top-7 px-2">
          <button 
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/50 border-4 border-[#F8FAFC] active:rotate-180 transition-all duration-500"
            onClick={() => window.dispatchEvent(new CustomEvent('rotate-pin'))} // Event trigger for the dashboard
          >
            <RefreshCw size={28} />
          </button>
        </div>

        {/* RIGHT ITEMS */}
        <div className="flex flex-1 justify-around items-center">
          {rightItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={location.pathname.startsWith(item.path)} />
          ))}
        </div>
      </nav>
    </div>
  );
};

// Internal Helper to keep the logic clean
const NavItem = ({ item, isActive }: { item: MenuItem; isActive: boolean }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative ${
        isActive ? "text-blue-400" : "text-slate-500 opacity-60"
      }`}
    >
      <Icon size={22} className={item.animate && !isActive ? "animate-spin" : ""} />
      <span className="text-[8px] font-black uppercase tracking-tighter">
        {item.label}
      </span>
      
      {/* Badge Logic preserved */}
      {item.badge && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-slate-900" />
      )}
    </Link>
  );
};

export default BottomNav;