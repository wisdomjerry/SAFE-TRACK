import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Database, ExternalLink } from "lucide-react";
import { useUser } from "../hooks/useUser";
import type { UserRole, MenuItem } from "./DashboardLayout";

interface SidebarProps {
  role: UserRole;
  menuItems: MenuItem[]; // This fixes the 'menuItems does not exist' error
}

interface UserData {
  id: string;
  name: string;
  role: string;
  school_id: string;
  school_name?: string;
  google_sheet_url?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role, menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Inside Sidebar component
  const { userData, loading } = useUser() as {
    userData: UserData | null;
    loading: boolean;
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };

  const displayName = loading ? "..." : userData?.name || "SafeTrack";
  const brandName = role === "SUPER_ADMIN" ? "SafeTrek Pro" : displayName;
  const brandLogo = role === "SUPER_ADMIN" ? "🌐" : "🏫";

  return (
    <aside className="h-dvh w-64 bg-[#0f172a] flex flex-col shrink-0 z-50 border-r border-white/5">
      {/* HEADER: DESKTOP ONLY */}
      <div className="p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-500/20">
            {brandLogo}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-white font-black text-sm truncate w-32 tracking-tight">
              {brandName}
            </h2>
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-0.5">
              {role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* NAV AREA: SCROLLABLE */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return <SidebarLink key={item.label} {...item} active={isActive} />;
        })}
      </nav>

      {/* FOOTER */}
      <div className="shrink-0 p-3 bg-[#0f172a] border-t border-white/5">
        {role === "SCHOOL_ADMIN" && (
          <SyncStatus sheetUrl={userData?.google_sheet_url} />
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all group"
        >
          <div className="p-1.5 bg-slate-800 group-hover:bg-rose-500/10 rounded-lg transition-colors">
            <LogOut size={16} />
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

// --- UPDATED HELPER COMPONENTS ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SidebarLink = ({ icon: Icon, label, path, animate }: any) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
        isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={18}
          className={`${isActive ? "text-white" : "text-slate-500"} ${
            animate ? "animate-spin" : ""
          }`}
        />
        <span
          className={`text-[13px] tracking-tight ${
            isActive ? "font-bold" : "font-medium"
          }`}
        >
          {label}
        </span>
      </>
    )}
  </NavLink>
);

const SyncStatus = ({ sheetUrl }: { sheetUrl?: string }) => (
  <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/5 group">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Database size={12} className="text-blue-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Sync Status
        </span>
      </div>
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
    </div>

    {sheetUrl ? (
      <a
        href={sheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-1.5 w-full bg-blue-600/10 hover:bg-blue-600/20 rounded-lg text-[9px] font-black text-blue-400 transition-colors border border-blue-400/20 uppercase tracking-tighter"
      >
        Manage Sheet <ExternalLink size={10} />
      </a>
    ) : (
      <div className="py-1.5 text-center bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 border border-white/5">
        LINK PENDING
      </div>
    )}
  </div>
);

export default Sidebar;
