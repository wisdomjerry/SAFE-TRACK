/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { Link, useNavigate } from "react-router-dom";

type UserRole = "DRIVER" | "PARENT" | "SCHOOL_ADMIN" | "SUPER_ADMIN";

interface TopNavProps {
  role: UserRole;
}

const TopNav: React.FC<TopNavProps> = ({ role }: { role: UserRole }) => {
  // 1. userData should now contain avatar_url from your updated getProfile controller
  const { userData, loading } = useUser() as any;
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const rolePathMap = {
    SUPER_ADMIN: "admin",
    SCHOOL_ADMIN: "school",
    DRIVER: "driver",
    PARENT: "parent",
  };

  const basePath = `/${rolePathMap[role]}`;

  const roleConfig = {
    SUPER_ADMIN: { title: "System Overview", userTitle: "Super Administrator" },
    SCHOOL_ADMIN: {
      title: "School Overview",
      userTitle: "School Administrator",
    },
    DRIVER: { title: "Route Dashboard", userTitle: "Transit Driver" },
    PARENT: { title: "Student Tracking", userTitle: "Parent Account" },
  };

  const { title, userTitle } = roleConfig[role];
  const userName = loading ? "Loading..." : userData?.name || "User";

  // 2. Prioritize the real avatar, fallback to UI Avatars
  const profileImg =
    userData?.avatar_url ||
    `https://ui-avatars.com/api/?name=${userName.replace(" ", "+")}&background=3b82f6&color=fff&bold=true`;

  const handleLogout = () => {
    localStorage.clear(); // Clear all to be safe
    navigate("/login");
  };

  return (
    <nav className="h-16 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between shrink-0 relative z-100">
      <div className="flex items-center">
        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* NOTIFICATIONS BELL */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className={`p-2 rounded-full transition-all ${showNotifications ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                <span className="font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                  2 NEW
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                  <p className="text-xs font-bold text-slate-800">
                    New School Registration
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Test Academy requested approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />

        {/* PROFILE SECTION */}
        <div className="relative">
          <div
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-2 group cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">
                {userName}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                {userTitle}
              </p>
            </div>

            <div className="relative">
              {/* UPDATED: Added object-cover to handle real images properly */}
              <img
                src={profileImg}
                alt="User Profile"
                className={`w-10 h-10 rounded-full border-2 object-cover transition-all ${
                  showProfileMenu
                    ? "border-blue-500 shadow-md scale-105"
                    : "border-white shadow-sm"
                }`}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-50 md:hidden">
                <p className="text-sm font-bold text-slate-900">{userName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {userTitle}
                </p>
              </div>

              <Link
                to={`${basePath}/profile`}
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <User size={16} />
                </div>
                <span className="font-semibold">My Profile</span>
              </Link>

              <Link
                to={`${basePath}/accountsettings`}
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                  <Settings size={16} />
                </div>
                <span className="font-semibold">Settings</span>
              </Link>

              <div className="h-px bg-slate-50 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-bold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
