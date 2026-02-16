import {
  MapPin,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Settings,
  Bell,
  Globe,
  Lock,
  Edit2,
  Bus,
  Users,
  School,
  Crown,
} from "lucide-react";
import { useUser } from "../hooks/useUser";

type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "DRIVER" | "PARENT";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  location?: string;
  phone?: string;
  school_name?: string;
}

const ProfilePage = () => {
  const { userData } = useUser() as {
    userData: UserData | null;
  };

  const role = userData?.role;

  /* ================= ROLE CONFIG ================= */

  const roleConfig = {
    SUPER_ADMIN: {
      label: "Super Admin",
      icon: Crown,
      stats: [
        { label: "Total Schools", value: "24" },
        { label: "System Health", value: "99.9%" },
      ],
    },
    SCHOOL_ADMIN: {
      label: "School Admin",
      icon: School,
      stats: [
        { label: "Students", value: "1,248" },
        { label: "Active Drivers", value: "18" },
      ],
    },
    DRIVER: {
      label: "Driver",
      icon: Bus,
      stats: [
        { label: "Trips Completed", value: "312" },
        { label: "Safety Score", value: "98%" },
      ],
    },
    PARENT: {
      label: "Parent",
      icon: Users,
      stats: [
        { label: "Children Linked", value: "2" },
        { label: "Pickup Accuracy", value: "100%" },
      ],
    },
  };

  const currentRole = role ? roleConfig[role] : null;

  /* ================= MENU ================= */

  const menuItems = [
    { label: "Account Settings", icon: Settings },
    { label: "Notifications", icon: Bell },
    { label: "Devices", icon: Globe },
    { label: "Security", icon: Lock },
  ];

  return (
    <div className="w-full min-h-full p-6 md:p-12 space-y-10 bg-slate-50">

      {/* ================= HERO ================= */}

      <div className="bg-white rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100 p-10">

        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full ring-4 ring-slate-100 overflow-hidden">
              <img
                src={`https://ui-avatars.com/api/?name=${userData?.name?.replace(
                  " ",
                  "+"
                )}&background=0f172a&color=fff&size=256`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">

            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              {userData?.name}
            </h1>

            {currentRole && (
              <p className="mt-2 text-sm font-medium text-slate-500">
                {currentRole.label}
              </p>
            )}

            <div className="mt-8 grid sm:grid-cols-2 gap-6 text-sm text-slate-600">

              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                {userData?.email}
              </div>

              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                {userData?.phone || "+256 700 000 000"}
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />
                {userData?.location || "Kampala, Uganda"}
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400" />
                Joined February 2026
              </div>
            </div>

            <div className="mt-10 flex gap-4 justify-center md:justify-start">
              <button className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition">
                Edit Profile
              </button>

              <button className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition">
                <Edit2 size={18} className="text-slate-600" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ================= ROLE STATS ================= */}

      {currentRole && (
        <div className="bg-white rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100 p-10">

          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                {currentRole.label} Overview
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Performance & system metrics
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ShieldCheck size={20} className="text-slate-600" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {currentRole.stats.map((stat, i) => (
              <div
                key={i}
                className="relative rounded-3xl bg-slate-50 p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-8 right-8 h-0.75 rounded-full bg-linear-to-r from-slate-900 to-slate-400 opacity-70" />

                <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-4">
                  {stat.label}
                </p>

                <p className="text-4xl font-bold text-slate-900">
                  {stat.value}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Status
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* ================= SETTINGS MENU ================= */}

      <div className="bg-white rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">

        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className="w-full flex items-center justify-between px-8 py-6 hover:bg-slate-50 transition border-b last:border-0"
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} className="text-slate-400" />
              <span className="font-medium text-slate-700">
                {item.label}
              </span>
            </div>

            <ChevronRight size={18} className="text-slate-300" />
          </button>
        ))}

      </div>

    </div>
  );
};

export default ProfilePage;
