import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import SetupWizard from "../components/SetupWizard";
import {
  Calendar,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  LayoutDashboard,
  RefreshCcw,
} from "lucide-react";

const AdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onboardingOverride, setOnboardingOverride] = useState(false);

  // Wrapped in useCallback so it can be passed to the Wizard safely
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get("/api/school/stats");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error loading dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- NEW: Celebration & Transition Logic ---
  const handleSetupComplete = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      });
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      });
    }, 250);

    // Switch the view and refresh data
    setOnboardingOverride(true);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const getPathData = (values: number[]) => {
    if (!values || values.length === 0) return "M0,80 L100,80";
    const max = Math.max(...values, 10);
    const points = values.map((val, i) => {
      const x = i * 25;
      const y = 90 - (val / max) * 60;
      return `${x},${y}`;
    });
    return `M${points.join(" L")}`;
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
            <LayoutDashboard
              className="absolute inset-0 m-auto text-blue-600/50"
              size={16}
            />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
            Establishing Secure Link...
          </p>
        </div>
      </div>
    );
  }

  // --- SHOW WIZARD IF SYNC IS PENDING ---
  if (data?.needsOnboarding && !onboardingOverride) {
    return (
      <SetupWizard 
        onComplete={handleSetupComplete} 
      />
    );
  }

  return (
    <div className="max-w-350 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16 px-4">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <div className="h-1 w-8 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Live Overview
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#1d1c1d] tracking-tight">
            School Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Welcome back. Here is what is happening with your fleet today.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-2 text-right border-r border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Current Time
            </p>
            <p className="text-sm font-bold text-[#1d1c1d]">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all group"
          >
            <RefreshCcw
              size={18}
              className="group-active:rotate-180 transition-transform duration-500"
            />
          </button>
        </div>
      </div>

      {/* --- 1. STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={data?.stats?.totalStudents?.toLocaleString() || "0"}
          color="text-blue-600"
          trend="Registered in system"
        />
        <StatCard
          title="Total Drivers"
          value={data?.stats?.totalDrivers || "0"}
          color="text-emerald-600"
          trend="Verified active staff"
        />
        <StatCard
          title="Vans Operating"
          value={data?.stats?.activeVans || "0"}
          color="text-amber-600"
          trend="Fleet online now"
        />
        <StatCard
          title="Attendance Rate"
          value={data?.stats?.attendanceRate || "0%"}
          color="text-indigo-600"
          trend="Real-time check-ins"
        />
        <StatCard
          title="Pickups Today"
          value={data?.totalPickups || "0"}
          color="text-emerald-600"
          trend="Successful handovers today"
        />
        <StatCard
          title="Currently On Board"
          value={data?.currentlyOnBoard || "0"}
          color="text-amber-600"
          trend="Students in transit now"
        />
        <StatCard
          title="Safety Alerts"
          value={data?.alertsCount || "0"}
          color={data?.alertsCount > 0 ? "text-red-600" : "text-indigo-600"}
          trend={
            data?.alertsCount > 0
              ? "Immediate attention required"
              : "No safety gaps detected"
          }
        />
      </div>

      {/* --- 2. TRENDS & LIVE STATUS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-[#1d1c1d]">
                Attendance Trends
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Weekly student pickup volume
              </p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> This Week
              </span>
            </div>
          </div>

          <div className="h-64 w-full relative">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${getPathData(data?.chart || [0, 0, 0, 0, 0])} L100,100 L0,100 Z`}
                fill="url(#lineGradient)"
                className="animate-in fade-in duration-1000"
              />
              <path
                d={getPathData(data?.chart || [0, 0, 0, 0, 0])}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-700 ease-in-out"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-8 text-[11px] text-gray-400 font-black uppercase tracking-tighter px-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <span>{day}</span>
                <span className="text-blue-600 font-black">
                  {data?.chart?.[i] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1d1c1d] p-8 rounded-4xl shadow-xl text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <MapPin size={120} />
          </div>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3">
            Live Trips{" "}
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          </h3>
          <div className="space-y-4 relative z-10">
            {data?.liveRoutes?.length > 0 ? (
              data.liveRoutes.map((route: any) => (
                <RouteStatusItem
                  key={route.id}
                  name={`${route.type === "pickup" ? "Morning" : "Evening"} Trip`}
                  driver={route.drivers?.full_name}
                  status={route.status}
                  plate={route.vans?.plate_number}
                  isDark
                />
              ))
            ) : (
              <div className="py-12 text-center border border-white/10 rounded-3xl bg-white/5">
                <Clock className="mx-auto mb-3 text-white/20" size={32} />
                <p className="text-sm font-bold text-white/40">
                  No active trips
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- 3. ACTIVITY & DRIVERS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-[#1d1c1d]">Recent Logs</h3>
            <button className="text-[10px] font-black uppercase text-blue-600 hover:tracking-widest transition-all flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-6">
            {data?.recentActivity?.length > 0 ? (
              data.recentActivity.map((log: any) => (
                <AlertItem
                  key={log.id}
                  title={log.students?.full_name}
                  description={`Status updated to ${log.status.replace("_", " ")}`}
                  time={new Date(log.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              ))
            ) : (
              <p className="text-center py-10 text-gray-400 font-medium italic">
                No activity logs recorded yet.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-[#1d1c1d]">
              Top Rated Staff
            </h3>
            <Star className="text-amber-400" fill="currentColor" size={20} />
          </div>
          <div className="space-y-6">
            {data?.topDrivers?.length > 0 ? (
              data.topDrivers.map((driver: any) => (
                <DriverRatingItem
                  key={driver.id}
                  name={driver.full_name}
                  trips={driver.total_trips}
                  rating={driver.rating}
                />
              ))
            ) : (
              <p className="text-center py-10 text-gray-400 font-medium italic">
                Driver performance metrics pending.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const RouteStatusItem = ({ name, driver, status, plate, isDark }: any) => {
  const isDelayed = status === "delayed";
  return (
    <div
      className={`p-5 rounded-3xl border transition-all ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10"
          : "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-black text-sm">{name}</p>
          <p
            className={`text-[10px] font-bold ${isDark ? "text-white/40" : "text-gray-400"}`}
          >
            {driver}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
            isDelayed ? "bg-red-500 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {status}
        </span>
      </div>
      <div
        className={`text-[10px] font-black tracking-widest ${isDark ? "text-blue-400" : "text-blue-600"}`}
      >
        VAN: {plate}
      </div>
    </div>
  );
};

const AlertItem = ({ title, description, time }: any) => (
  <div className="flex gap-5 group cursor-default">
    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
      <Calendar
        className="text-gray-400 group-hover:text-blue-500 transition-colors"
        size={18}
      />
    </div>
    <div className="flex-1 border-b border-gray-50 pb-4">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-sm text-[#1d1c1d]">
          {title || "System Log"}
        </h4>
        <span className="text-[10px] font-bold text-gray-400">{time}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  </div>
);

const DriverRatingItem = ({ name, trips, rating }: any) => (
  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-all">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
        {name?.charAt(0)}
      </div>
      <div>
        <p className="font-black text-sm text-[#1d1c1d]">{name}</p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
          {trips} Trips Completed
        </p>
      </div>
    </div>
    <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-1">
      <span className="font-black text-sm text-amber-600">
        {Number(rating || 5).toFixed(1)}
      </span>
      <Star size={12} className="text-amber-500" fill="currentColor" />
    </div>
  </div>
);

export default AdminDashboard;