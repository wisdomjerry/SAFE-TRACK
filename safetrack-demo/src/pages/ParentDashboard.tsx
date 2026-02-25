import { useEffect, useState, useCallback, useRef } from "react";
import axios from "../api/axios";
import { supabase } from "../config/supabaseClient";
import LiveMap from "../components/LiveMap";
import {
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
  School,
  Sun,
  Moon,
  Navigation,
  Camera,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// --- INTERFACES ---
interface Child {
  id: string;
  full_name: string;
  grade: string;
  school_name: string;
  van_id: string;
  guardian_pin: string;
  handover_token: string;
  is_on_bus: boolean;
  status: string;
  lat: number;
  lng: number;
  current_speed: number;
  current_location_name: string;
  heading: number;
  driver_name?: string;
  driver_phone?: string;
  home_lat?: number;
  home_lng?: number;
  driver?: DriverInfo;
  avatar_url?: string;
}

interface DriverInfo {
  full_name: string;
  phone_number: string;
  avatar_url?: string;
}

interface LogEntry {
  id: string;
  action_type: "pickup" | "dropoff";
  scanned_at: string;
  van_id: string;
}

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ParentDashboard = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardianPin, setGuardianPin] = useState("");
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasNotifiedProximity, setHasNotifiedProximity] = useState(false);
  const [showToast, setShowToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const prevIsOnBusRef = useRef<boolean | null>(null);
  const isUpdatingRef = useRef(false);
  const activeChild = children.length > 0 ? children[0] : null;

  const theme = {
    bg: isDarkMode ? "bg-[#0F0F10]" : "bg-[#F4F7FA]",
    card: isDarkMode ? "bg-[#1C1C1E]" : "bg-white",
    textMain: isDarkMode ? "text-white" : "text-slate-900",
    textSub: isDarkMode ? "text-slate-400" : "text-slate-500",
    border: isDarkMode ? "border-white/5" : "border-slate-100",
    inner: isDarkMode ? "bg-white/5" : "bg-slate-50",
  };

  const loadData = useCallback(async () => {
    try {
      const res = await axios.get("/api/parents/children");
      const childrenData: Child[] = res.data.data || [];

      setChildren((prev) => {
        if (isUpdatingRef.current) {
          return childrenData.map((newChild) => {
            const currentUI = prev.find((c) => c.id === newChild.id);
            return currentUI
              ? { ...newChild, is_on_bus: currentUI.is_on_bus }
              : newChild;
          });
        }
        return childrenData;
      });

      if (childrenData.length > 0) {
        const firstChild = childrenData[0];
        setGuardianPin(firstChild.guardian_pin || "");

        if (!isUpdatingRef.current) {
          prevIsOnBusRef.current = firstChild.is_on_bus;
        }

        const { data: historyData } = await supabase
          .from("van_location_history")
          .select("lat, lng")
          .eq("van_id", firstChild.van_id)
          .order("created_at", { ascending: true })
          .limit(50);

        if (historyData) {
          setRoutePath(historyData.map((h) => [h.lat, h.lng]));
        }

        const logsRes = await axios.get(
          `/api/parents/history/${firstChild.id}`,
        );
        if (logsRes.data.success) {
          setLogs(logsRes.data.data as LogEntry[]);
        }
      }
    } catch (err) {
      console.error("❌ API Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Add this at the top of your Parent Dashboard component
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleStudentAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeChild?.id) return;

    setIsUpdatingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "safetrack_unsigned");

    try {
      // 1. Upload to Cloudinary
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dnxnr4ocz/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();

      if (data.secure_url) {
        // 2. Update students table in Supabase
        const { error } = await supabase
          .from("students")
          .update({ avatar_url: data.secure_url })
          .eq("id", activeChild.id);

        if (error) throw error;

        alert("Student photo updated!");
        window.location.reload(); // Refresh to show new image
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to update student photo.");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const autoRotatePin = async (studentId: string) => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await axios.patch(`/api/parents/students/${studentId}/guardian-pin`, {
        guardian_pin: newPin,
      });
      setGuardianPin(newPin);
    } catch (err) {
      console.error("Auto-rotation failed", err);
    }
  };

  const updateHomeLocation = () => {
    if (!activeChild) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        await axios.patch(
          `/api/parents/students/${activeChild.id}/home-location`,
          {
            home_lat: latitude,
            home_lng: longitude,
          },
        );
        setShowToast({ show: true, msg: "📍 Home location updated!" });
        setTimeout(() => setShowToast({ show: false, msg: "" }), 3000);
        loadData();
      } catch (err) {
        console.error("Failed to save home location", err);
      }
    });
  };

  useEffect(() => {
    if (!activeChild || hasNotifiedProximity || !activeChild.is_on_bus) return;

    const destLat = activeChild.home_lat || 0.3476;
    const destLng = activeChild.home_lng || 32.5825;
    const distance = getDistance(
      activeChild.lat,
      activeChild.lng,
      destLat,
      destLng,
    );

    if (distance < 0.5) {
      setShowToast({
        show: true,
        msg: "🚍 Van is nearly at the drop-off point!",
      });
      setHasNotifiedProximity(true);
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    }
  }, [
    activeChild?.lat,
    activeChild?.lng,
    activeChild?.is_on_bus,
    hasNotifiedProximity,
    activeChild,
  ]);

  useEffect(() => {
    if (children.length === 0) return;

    const vanChannel = supabase
      .channel("live-van-tracking")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vans" },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newData = payload.new as any;
          setChildren((current) =>
            current.map((child) =>
              child.van_id === newData.id
                ? {
                    ...child,
                    lat: newData.current_lat,
                    lng: newData.current_lng,
                    current_speed: newData.current_speed,
                    current_location_name: newData.current_location_name,
                    heading: newData.heading,
                  }
                : child,
            ),
          );
        },
      )
      .subscribe();

    const studentChannel = supabase
      .channel("student-status-monitor")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students" },
        (payload) => {
          const updatedFields = payload.new as Child;

          const hasBoarded =
            prevIsOnBusRef.current === false &&
            updatedFields.is_on_bus === true;
          const hasDropped =
            prevIsOnBusRef.current === true &&
            updatedFields.is_on_bus === false;

          if (hasBoarded || hasDropped) {
            isUpdatingRef.current = true;
            prevIsOnBusRef.current = updatedFields.is_on_bus;
            setShowToast({
              show: true,
              msg: hasBoarded
                ? "Child has boarded the van!"
                : "Child has been dropped off!",
            });

            setTimeout(() => setShowToast({ show: false, msg: "" }), 5000);

            if (hasBoarded) {
              autoRotatePin(updatedFields.id);
              setHasNotifiedProximity(false);
            }

            setTimeout(async () => {
              await loadData();
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 1000);
            }, 3000);
          }

          setChildren((current) => {
            return current.map((c) =>
              c.id === updatedFields.id ? { ...c, ...updatedFields } : c,
            );
          });

          if (updatedFields.guardian_pin) {
            setGuardianPin(updatedFields.guardian_pin);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vanChannel);
      supabase.removeChannel(studentChannel);
    };
  }, [children.length, loadData]);

  if (loading || !activeChild)
    return (
      <div
        className={`h-screen flex items-center justify-center ${theme.bg} font-black text-blue-600 animate-pulse`}
      >
        Safetrack Live...
      </div>
    );

  return (
    <div
      className={`${theme.bg} min-h-screen pb-32 transition-colors duration-300`}
    >
      {showToast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 size={24} />
            <p className="font-bold text-sm">{showToast.msg}</p>
          </div>
        </div>
      )}

      <header
        className={`${theme.card} backdrop-blur-md sticky top-0 z-40 px-6 pt-10 pb-6 flex justify-between items-start border-b ${theme.border}`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-blue-600" />
            <span
              className={`text-sm font-bold ${theme.textMain} tracking-tight`}
            >
              SafeTrack
            </span>

            {/* NEW: School Name Display */}
          <p
            className={`text-sm font-bold opacity-70 ${theme.textMain} mt-1 flex items-center gap-1`}
          >
            <School size={14} className="text-blue-500" />
            {activeChild.school_name}
          </p>
          </div>

          

          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleStudentAvatarChange}
              accept="image/*"
            />

            <div className="flex items-center gap-4 mb-4">
              {/* Student Avatar Display */}
              <div
                className="relative cursor-pointer group"
                onClick={handleAvatarClick}
              >
                <img
                  src={
                    activeChild.avatar_url ||
                    `https://ui-avatars.com/api/?name=${activeChild.full_name.replace(" ", "+")}&background=0f172a&color=fff`
                  }
                  className={`w-16 h-16 rounded-2xl object-cover border-2 ${isUpdatingAvatar ? "opacity-50" : "opacity-100"}`}
                  alt="Student"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-2xl transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span
                    className={`text-xs font-bold ${theme.textMain} tracking-tight`}
                  >
                    SafeTrack
                  </span>
                </div>
                <h1
                  className={`text-2xl font-black ${theme.textMain} leading-tight`}
                >
                  {activeChild.full_name}
                </h1>
              </div>
            </div>
          </div>

          {/* NEW: Driver Quick Info Bar */}
          {activeChild.driver && (
            <div
              className={`flex items-center justify-between p-3 rounded-2xl ${isDarkMode ? "bg-white/5 border-white/10" : "bg-blue-50/50 border-blue-100"} border mt-2 animate-in fade-in slide-in-from-left-4`}
            >
              <div className="flex items-center gap-3">
                {/* Driver Avatar */}
                <div className="relative">
                  <img
                    src={
                      activeChild.driver.avatar_url ||
                      `https://ui-avatars.com/api/?name=${activeChild.driver.full_name.replace(" ", "+")}&background=3b82f6&color=fff`
                    }
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    alt="Driver"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                {/* Name and Role */}
                <div>
                  <p
                    className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-blue-600/70"}`}
                  >
                    Assigned Driver
                  </p>
                  <p className={`text-sm font-bold ${theme.textMain}`}>
                    {activeChild.driver.full_name}
                  </p>
                </div>
              </div>

              {/* Action: Phone Dialer */}
              <a
                href={`tel:${activeChild.driver.phone_number}`}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-90 transition-all shadow-lg shadow-blue-200"
              >
                <Phone size={18} fill="currentColor" />
              </a>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={updateHomeLocation}
            className={`w-10 h-10 ${theme.inner} border ${theme.border} rounded-xl flex items-center justify-center active:scale-95 transition-transform`}
          >
            <MapPin size={18} className="text-emerald-500" />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 ${theme.inner} border ${theme.border} rounded-xl flex items-center justify-center`}
          >
            {isDarkMode ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-blue-600" />
            )}
          </button>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-8">
        {/* AUTOMATED HANDOVER SECTION - TRIGGERED ONLY BY "waiting" STATUS */}
        {activeChild.status === "waiting" && (
          <section
            className={`${theme.card} rounded-[2.5rem] p-8 shadow-2xl border-2 border-blue-600/20 text-center animate-in slide-in-from-bottom-10 duration-700`}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <p
                className={`text-[10px] font-black ${theme.textSub} uppercase tracking-[0.2em]`}
              >
                {activeChild.is_on_bus
                  ? "Driver Ready: Drop-off Scan"
                  : "Driver Ready: Pickup Scan"}
              </p>
            </div>

            <div className="inline-block p-4 bg-white rounded-3xl mb-6 shadow-sm ring-8 ring-blue-500/5">
              <QRCodeSVG
                value={activeChild.handover_token || activeChild.id}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex gap-2 justify-center mb-4">
              {guardianPin.split("").map((char, i) => (
                <div
                  key={i}
                  className={`w-10 h-14 ${theme.inner} rounded-xl flex items-center justify-center text-2xl font-black ${theme.textMain} border-2 ${theme.border} shadow-sm`}
                >
                  {char}
                </div>
              ))}
            </div>
            <p className={`text-[10px] ${theme.textSub} font-bold italic`}>
              Present this to the driver for verification
            </p>
          </section>
        )}

        {/* LIVE MAP SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className={`font-black ${theme.textMain} text-sm uppercase`}>
              Live Tracking
            </h3>
            <span
              className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${
                activeChild.status === "picked_up"
                  ? "text-emerald-600 bg-emerald-500/10"
                  : activeChild.status === "waiting"
                    ? "text-blue-600 bg-blue-500/10"
                    : "text-amber-600 bg-amber-500/10"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  activeChild.status === "picked_up"
                    ? "bg-emerald-500 animate-ping"
                    : "bg-amber-500"
                }`}
              />
              {activeChild.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div
            className={`${theme.card} rounded-[2.5rem] p-2 relative shadow-lg border ${theme.border}`}
          >
            <div className="h-64 w-full rounded-[2.2rem] overflow-hidden">
              <LiveMap
                lat={activeChild.lat}
                lng={activeChild.lng}
                isOnBus={activeChild.is_on_bus}
                routePath={routePath}
                heading={activeChild.heading}
              />
            </div>
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${activeChild.lat},${activeChild.lng}`,
                  "_blank",
                )
              }
              className="absolute bottom-20 right-6 bg-white p-3 rounded-full shadow-lg text-blue-600 active:scale-90"
            >
              <Navigation size={20} fill="currentColor" />
            </button>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${isDarkMode ? "bg-blue-500/20" : "bg-blue-50"} flex items-center justify-center text-blue-600`}
                >
                  <MapPin size={20} />
                </div>
                <div className="max-w-45">
                  <p
                    className={`text-[10px] ${theme.textSub} font-black uppercase`}
                  >
                    Current Location
                  </p>
                  <p className={`text-xs font-bold ${theme.textMain} truncate`}>
                    {activeChild.current_location_name || "Detecting..."}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${activeChild.driver_phone}`}
                className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>
        </section>

        {/* ACTIVITY LOGS */}
        <div className="space-y-6">
          <HistorySection
            title="Pickup Activity"
            theme={theme}
            items={logs.filter((l) => l.action_type === "pickup")}
          />
          <HistorySection
            title="Drop-off Activity"
            theme={theme}
            isDropoff
            items={logs.filter((l) => l.action_type === "dropoff")}
          />
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HistorySection = ({ title, theme, items, isDropoff }: any) => (
  <section>
    <h3 className={`font-black ${theme.textMain} text-sm mb-4 px-2`}>
      {title}
    </h3>
    <div
      className={`${theme.card} rounded-3xl p-2 space-y-1 border ${theme.border}`}
    >
      {items && items.length > 0 ? (
        items.map((log: LogEntry) => (
          <HistoryItem
            key={log.id}
            icon={
              isDropoff ? (
                <MapPin size={14} className="text-blue-600" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-500" />
              )
            }
            title={isDropoff ? "Dropped at Home" : "Picked up from School"}
            time={new Date(log.scanned_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            bus={`Van #${log.van_id.slice(-4)}`}
            theme={theme}
            statusColor={
              isDropoff
                ? "text-blue-600 bg-blue-500/10"
                : "text-emerald-500 bg-emerald-500/10"
            }
          />
        ))
      ) : (
        <div
          className={`p-10 text-center ${theme.textSub} text-[10px] font-bold uppercase opacity-50`}
        >
          No recent activity logs
        </div>
      )}
    </div>
  </section>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HistoryItem = ({ icon, title, time, bus, theme, statusColor }: any) => (
  <div
    className={`flex items-center justify-between p-4 ${theme.inner} rounded-2xl mb-1`}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <div>
        <h4 className={`text-sm font-bold ${theme.textMain}`}>{title}</h4>
        <p className={`text-[10px] ${theme.textSub} font-medium`}>
          {time} • {bus}
        </p>
      </div>
    </div>
    <span
      className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusColor}`}
    >
      Verified
    </span>
  </div>
);

export default ParentDashboard;
