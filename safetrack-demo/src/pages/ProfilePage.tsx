import { useState, useRef } from "react"; // Added useRef for image picking
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
  LogOut,
  Camera, // Added for the avatar overlay
  Loader2, // Added for upload feedback
} from "lucide-react";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient"; // Ensure you have your supabase client imported

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
  avatar_url?: string; // Added field
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { userData, setUserData } = useUser() as unknown as {
    userData: UserData | null;
    setUserData: (data: UserData) => void;
  };

  const role = userData?.role;

  /* ================= HANDLERS ================= */

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    // 1. Guard Clause: Check if userData exists before doing anything
    if (!userData?.id) {
      alert("User session not found. Please log in again.");
      return;
    }

    setIsUploading(true);
    const cloudName = "dnxnr4ocz";
    const uploadPreset = "safetrack_unsigned";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      // Send to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();

      if (!data.secure_url) throw new Error("Cloudinary upload failed");

      // 2. Update Supabase
      // TypeScript now knows userData.id is a string because of the guard clause above
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: data.secure_url })
        .eq("id", userData.id);

      if (error) throw error;

      // 3. Update local state
      if (setUserData) {
        // Use the functional update (prev => ...) to safely merge data
        (setUserData as React.Dispatch<React.SetStateAction<UserData | null>>)(
          (prev) => {
            if (!prev) return null;
            return { ...prev, avatar_url: data.secure_url };
          },
        );
      }

      alert("Profile picture updated!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error uploading image:", err);
      alert(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

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

  const currentRole = role ? roleConfig[role as Role] : null;

  const menuItems = [
    { label: "Account Settings", icon: Settings, path: "/settings" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Devices", icon: Globe, path: "/devices" },
    { label: "Security", icon: Lock, path: "/security" },
  ];

  return (
    <div className="w-full min-h-full p-6 md:p-12 space-y-10 bg-slate-50 pb-24">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* ================= HERO ================= */}
      <div className="bg-white rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100 p-10">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Avatar with Upload Trigger */}
          <div
            className="relative group cursor-pointer"
            onClick={handleAvatarClick}
          >
            <div className="w-32 h-32 rounded-full ring-4 ring-slate-100 overflow-hidden bg-slate-200 relative">
              {isUploading && (
                <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={24} />
                </div>
              )}
              <img
                src={
                  userData?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${userData?.name?.replace(" ", "+")}&background=0f172a&color=fff&size=256`
                }
                className="w-full h-full object-cover transition group-hover:scale-110"
                alt="Profile"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              {userData?.name || "Loading..."}
            </h1>
            {currentRole && (
              <p className="mt-2 text-sm font-medium text-slate-500 flex items-center justify-center md:justify-start gap-2">
                <currentRole.icon size={16} className="text-blue-600" />
                {currentRole.label}
              </p>
            )}

            <div className="mt-8 grid sm:grid-cols-2 gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" /> {userData?.email}
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />{" "}
                {userData?.phone || "No phone linked"}
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />{" "}
                {userData?.location || "Kampala, Uganda"}
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400" /> Joined{" "}
                {userData?.created_at
                  ? new Date(userData.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "February 2026"}
              </div>
            </div>

            <div className="mt-10 flex gap-4 justify-center md:justify-start">
              <button
                onClick={() => navigate("/settings")}
                className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
              >
                Edit Profile
              </button>
              <button
                onClick={handleAvatarClick}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition"
              >
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
                className="relative rounded-3xl bg-slate-50 p-8 border border-slate-100 transition-all hover:-translate-y-1"
              >
                <div className="absolute top-0 left-8 right-8 h-0.75 rounded-full bg-linear-to-r from-slate-900 to-slate-400 opacity-70" />
                <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-4">
                  {stat.label}
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
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
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between px-8 py-6 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} className="text-slate-400" />
              <span className="font-medium text-slate-700">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-8 py-6 hover:bg-rose-50 transition text-rose-500"
        >
          <div className="flex items-center gap-4">
            <LogOut size={20} className="text-rose-400" />
            <span className="font-bold uppercase tracking-widest text-xs">
              Sign Out
            </span>
          </div>
          <ChevronRight size={18} className="text-rose-200" />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
