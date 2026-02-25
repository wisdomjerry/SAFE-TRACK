/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Settings,
  Bell,
  Lock,
  Bus,
  Users,
  School,
  Crown,
  LogOut,
  Camera,
  Loader2,
} from "lucide-react";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "DRIVER" | "PARENT";

interface UserData {
  id?: string;
  name: string;
  email: string;
  role: Role;
  location?: string;
  phone?: string;
  school_name?: string;
  created_at?: string;
  avatar_url?: string;
}

// 1. Move the map outside, but DO NOT try to use userRole here.
const rolePathMap = {
  SUPER_ADMIN: "admin",
  SCHOOL_ADMIN: "school",
  DRIVER: "driver",
  PARENT: "parent",
} as const;

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { userData, loading } = useUser() as unknown as {
    userData: UserData | null;
    loading: boolean;
  };

  // 2. Calculate the base path INSIDE the component where userData exists.
  // We use "DRIVER" as a safe fallback for the type check.
  const userRole = (userData?.role as Role) || "DRIVER";
  const basePath = `/${rolePathMap[userRole]}`;

  const [isUploading, setIsUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({
    onboard: 0,
    waiting: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (userData?.role === "DRIVER" && userData?.id) {
        const { data: van } = await supabase
          .from("vans")
          .select("id")
          .eq("driver_id", userData.id)
          .single();

        if (van) {
          const { data: students } = await supabase
            .from("students")
            .select("status")
            .eq("assigned_van_id", van.id);

          if (students) {
            setLiveStats({
              onboard: students.filter((s) => s.status === "picked_up").length,
              waiting: students.filter(
                (s) => s.status === "waiting" || s.status === "pending",
              ).length,
              total: students.length,
            });
          }
        }
      }
    };
    fetchStats();
  }, [userData]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userData?.id) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "safetrack_unsigned");

    try {
      // 1. Upload to Cloudinary (This part works!)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dnxnr4ocz/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();

      if (data.secure_url) {
        // 2. Map the role to the correct table
        const tableMap: Record<Role, string> = {
          SUPER_ADMIN: "profiles",
          SCHOOL_ADMIN: "schools",
          DRIVER: "drivers",
          PARENT: "parents",
        };

        const targetTable = tableMap[userData.role];

        // 3. Update the CORRECT table
        const { error } = await supabase
          .from(targetTable) // Use the dynamic table name
          .update({ avatar_url: data.secure_url })
          .eq("id", userData.id);

        if (error) throw error;

        // 4. Update local state so it shows immediately
        setLocalAvatar(data.secure_url);

        // Optional: Update localStorage so the Navbar sees it immediately without a refresh
        localStorage.setItem("userAvatar", data.secure_url);

        alert("Success! Profile picture updated.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const roleConfig: Record<Role, any> = {
    SUPER_ADMIN: {
      label: "System Controller",
      icon: Crown,
      stats: [
        { label: "Live Vans", value: "Active" },
        { label: "System Health", value: "Optimal" },
      ],
    },
    SCHOOL_ADMIN: {
      label: "School Manager",
      icon: School,
      stats: [
        { label: "Students Registered", value: "Verified" },
        { label: "Fleet Status", value: "Running" },
      ],
    },
    DRIVER: {
      label: "Van Captain",
      icon: Bus,
      stats: [
        {
          label: "Students Onboard",
          value: `${liveStats.onboard}/${liveStats.total}`,
        },
        { label: "Remaining Stops", value: String(liveStats.waiting) },
      ],
    },
    PARENT: {
      label: "Guardian",
      icon: Users,
      stats: [
        {
          label: "Child Status",
          value: liveStats.onboard > 0 ? "On Bus" : "Safe",
        },
        { label: "Security Mode", value: "PIN Enabled" },
      ],
    },
  };

  const currentRole = roleConfig[userRole];

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-12 space-y-6 bg-slate-50 pb-24">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Profile Header */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div
            className="relative group cursor-pointer"
            onClick={handleAvatarClick}
          >
            <div className="w-32 h-32 rounded-full ring-4 ring-slate-50 overflow-hidden bg-slate-100 relative">
              {isUploading && (
                <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={24} />
                </div>
              )}
              <img
                src={
                  localAvatar || // 1. Immediate upload feedback
                  userData?.avatar_url || // 2. Fresh data from Hook/Backend
                  localStorage.getItem("userAvatar") || // 3. Backup for refreshes
                  `https://ui-avatars.com/api/?name=${userData?.name}&background=0f172a&color=fff`
                }
                className="w-full h-full object-cover"
                alt="Profile"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-black text-slate-900">
              {userData?.name || "User Name"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto md:mx-0">
              <currentRole.icon size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">
                {currentRole.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Stats Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {currentRole.stats.map((stat: any, i: number) => (
          <div
            key={i}
            className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <currentRole.icon size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Settings Menu */}
      <div className="bg-white rounded-4xl border border-slate-100 overflow-hidden shadow-sm">
        {[
          {
            label: "Account Settings",
            icon: Settings,
            path: `${basePath}/accountsettings`,
          },
          {
            label: "Privacy & Security",
            icon: Lock,
            path: `${basePath}/security`,
          },
          {
            label: "Notifications",
            icon: Bell,
            path: `${basePath}/notifications`,
          },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <item.icon size={18} />
              </div>
              <span className="font-bold text-slate-700">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-6 hover:bg-rose-50 transition group text-rose-500"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-400 group-hover:bg-rose-100">
              <LogOut size={18} />
            </div>
            <span className="font-bold">Log Out</span>
          </div>
          <ChevronRight size={18} className="text-rose-200" />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
