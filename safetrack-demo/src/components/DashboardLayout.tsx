import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import { useUser } from "../hooks/useUser";
import axios from "../api/axios";
import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  Bus,
  MapPin,
  Bell,
  ClipboardList,
  RefreshCw,
  ShieldCheck, 
  type LucideIcon,
} from "lucide-react";

export type UserRole = "DRIVER" | "PARENT" | "SCHOOL_ADMIN" | "SUPER_ADMIN";

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: boolean;
  animate?: boolean;
}

// ✅ THIS IS THE MISSING PIECE
export const ProtectedRoute = ({
  allowedRole,
  userRole,
}: {
  allowedRole: string;
  userRole: string | null;
}) => {
  const token = localStorage.getItem("authToken");

  // If there is no token, they aren't logged in at all
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If we have a role but it doesn't match the route, send them home
  if (userRole && allowedRole !== userRole) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, let them through
  return <Outlet />;
};

const DashboardLayout = ({ role }: { role: UserRole }) => {
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const { userData, loading } = useUser(); 
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchChildId = async () => {
      if (role === "PARENT" && userData && !activeChildId) {
        try {
          const res = await axios.get("/api/parents/children");
          if (res.data.data?.length > 0) {
            setActiveChildId(res.data.data[0].id);
          }
        } catch (err) {
          console.error("Layout: Failed to fetch child", err);
        }
      }
    };
    fetchChildId();
  }, [role, userData, activeChildId]);

  // 1. SLEEK LOADING SPINNER
  // This handles the Render "Cold Start" (the 30-second morning wait)
  if (loading && token) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          {/* Outer rotating ring */}
          <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
          {/* Inner static shield icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck size={32} className="text-blue-500/50 animate-pulse" />
          </div>
        </div>
        <h2 className="text-white font-black text-lg tracking-tight mb-2">
          SafeTrek
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Securing Session...
        </p>
        <p className="text-slate-600 text-[9px] mt-8 max-w-50 leading-relaxed">
          Waking up secure servers. This usually takes a few seconds in the
          morning.
        </p>
      </div>
    );
  }

  // 2. Fallback: If no user and not loading, ProtectedRoute usually handles this,
  // but we add a safety check here.
  if (!userData && !loading && !token) {
    return <Navigate to="/login" replace />;
  }

  const roleMenus: Record<UserRole, MenuItem[]> = {
    SUPER_ADMIN: [
  { label: "Home", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Schools", path: "/admin/schools", icon: School },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Reports", path: "/admin/reports", icon: FileText }, // Added back
  { label: "Permissions", path: "/admin/permissions", icon: ShieldCheck }, // Added back
  { label: "Settings", path: "/admin/settings", icon: Settings },
],
    SCHOOL_ADMIN: [
      { label: "Home", path: "/school/dashboard", icon: LayoutDashboard },
      { label: "Students", path: "/school/students", icon: Users },
      { label: "Drivers", path: "/school/drivers", icon: ClipboardList },
      { label: "Vans", path: "/school/routes", icon: Bus },
    ],
    DRIVER: [
      { label: "My Route", path: "/driver/dashboard", icon: MapPin },
      { label: "Student List", path: "/driver/students", icon: Users },
      {
        label: "Notifications",
        path: "/driver/notifications",
        icon: Bell,
        badge: true,
      },
    ],
    PARENT: [
      { label: "Live Tracking", path: "/parent/dashboard", icon: MapPin },
      {
        label: activeChildId ? "Child History" : "Loading...",
        path: activeChildId
          ? `/parent/history/${activeChildId}`
          : "/parent/dashboard",
        icon: activeChildId ? ClipboardList : RefreshCw,
        animate: !activeChildId,
      },
    ],
  };

  const currentMenu = roleMenus[role] || [];

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden text-slate-200">
      <div className="hidden lg:flex">
        <Sidebar role={role} menuItems={currentMenu} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <TopNav role={role} />

        <main className="flex-1 overflow-y-auto">
          <div className=" mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <BottomNav menuItems={currentMenu} />
      </div>
    </div>
  );
};

export default DashboardLayout;
