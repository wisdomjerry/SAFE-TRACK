import { Mail, Shield, MapPin, Clock, Star, Award } from "lucide-react";
import { useUser } from "../hooks/useUser";


const ProfilePage = () => {
  const { userData } = useUser();

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      {/* Hero Profile Card */}
      <div className="bg-linear-to-br from-blue-600 to-blue-800 rounded-4xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${userData?.name?.replace(" ", "+")}&background=fff&color=3b82f6&size=128&bold=true`}
              className="w-28 h-28 rounded-3xl shadow-2xl border-4 border-white/20 object-cover"
              alt="Profile"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl border-4 border-blue-700">
              <Shield size={16} className="text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight">{userData?.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {userData?.role?.replace("_", " ")}
              </span>
              <span className="bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Active Session
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Trust Score", value: "98%", icon: Star, color: "text-amber-500" },
          { label: "Login Streak", value: "12 Days", icon: Clock, color: "text-blue-500" },
          { label: "Tasks Done", value: "142", icon: Award, color: "text-purple-500" },
          { label: "Location", value: "Uganda", icon: MapPin, color: "text-rose-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <stat.icon className={`${stat.color} mb-2`} size={20} />
            <span className="text-xl font-black text-slate-900">{stat.value}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Mail size={18} className="text-blue-500" /> Account Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase">Email</span>
              <span className="text-sm font-semibold text-slate-700">{userData?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Joined</span>
              <span className="text-sm font-semibold text-slate-700">Feb 2026</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
             Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <div>
                <p className="text-xs font-bold text-slate-800">Logged in from Mobile</p>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Moto G14 • 2 mins ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 h-8 bg-slate-200 rounded-full" />
              <div>
                <p className="text-xs font-bold text-slate-800">Updated Profile</p>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Desktop • 3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;