import { useEffect, useState, useCallback, useRef } from "react";
import axios from "../api/axios";
import { supabase } from "../config/supabaseClient";
import LiveMap from "../components/LiveMap";
import {
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Sun,
  Moon,
  Navigation,
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
  const activeChild = children.length > 0 ? children[0] : null;

  const theme = {
    bg: isDarkMode ? "bg-[#0F0F10]" : "bg-[#F4F7FA]",
    card: isDarkMode ? "bg-[#1C1C1E]" : "bg-white",
    textMain: isDarkMode ? "text-white" : "text-slate-900",
    textSub: isDarkMode ? "text-slate-400" : "text-slate-500",
    border: isDarkMode ? "border-white/5" : "border-slate-100",
    inner: isDarkMode ? "bg-white/5" : "bg-slate-50",
  };

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    try {
      const res = await axios.get("/api/parents/children");
      const childrenData: Child[] = res.data.data || [];

      // LOG DATA FROM API
      console.log(
        "📥 API DATA LOADED:",
        childrenData[0]?.is_on_bus ? "ON BOARD" : "WAITING",
      );

      setChildren(childrenData);

      if (childrenData.length > 0) {
        const firstChild = childrenData[0];
        setGuardianPin(firstChild.guardian_pin || "");

        // Synchronize our Ref with the database state
        prevIsOnBusRef.current = firstChild.is_on_bus;

        // Fetch History
        const { data: history } = await supabase
          .from("van_location_history")
          .select("lat, lng")
          .eq("van_id", firstChild.van_id)
          .order("created_at", { ascending: true })
          .limit(50);
        if (history) setRoutePath(history.map((h) => [h.lat, h.lng]));

        // Fetch Logs
        const { data: logsData } = await supabase
          .from("pickup_logs")
          .select("id, action_type, scanned_at, van_id")
          .eq("student_id", firstChild.id)
          .order("scanned_at", { ascending: false })
          .limit(10);
        if (logsData) setLogs(logsData as LogEntry[]);
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

  // --- PIN ROTATION ---
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

  // --- UPDATE HOME LOCATION ---
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

  // --- GEOFENCE MONITOR ---
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

  // --- REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    if (children.length === 0) return;

    // 1. VAN TRACKING
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

    // 2. STUDENT STATUS (BOARDING/PIN)
    // 2. STUDENT STATUS (BOARDING/PIN)
    const studentChannel = supabase
      .channel("student-status-monitor")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students" },
        (payload) => {
          const updatedFields = payload.new as Child;

          console.log("🔔 REALTIME UPDATE RECEIVED:", {
            studentId: updatedFields.id,
            isOnBus: updatedFields.is_on_bus,
            currentRef: prevIsOnBusRef.current,
          });

          // Detect Change
          const hasBoarded =
            prevIsOnBusRef.current === false &&
            updatedFields.is_on_bus === true;
          const hasDropped =
            prevIsOnBusRef.current === true &&
            updatedFields.is_on_bus === false;

          if (hasBoarded || hasDropped) {
            console.log(
              `🚀 TRANSITION DETECTED: ${hasBoarded ? "BOARDING" : "DROPPING"}`,
            );

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

            // --- THE FIX FOR THE FLICKER ---
            // Instead of calling loadData immediately, we log the state
            console.log(
              "⏳ Waiting 3 seconds before refreshing logs to prevent flicker...",
            );
            setTimeout(() => {
              console.log("🔄 Triggering loadData refresh...");
              loadData();
            }, 3000);
          }

          // IMMEDIATE STATE UPDATE
          setChildren((current) => {
            const nextState = current.map((c) =>
              c.id === updatedFields.id ? { ...c, ...updatedFields } : c,
            );
            console.log(
              "🎨 UI STATE UPDATED TO:",
              nextState[0]?.is_on_bus ? "ON BOARD" : "WAITING",
            );
            return nextState;
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
      {/* TOAST NOTIFICATION */}
      {showToast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 size={24} />
            <p className="font-bold text-sm">{showToast.msg}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
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
          </div>
          <h1 className={`text-2xl font-black ${theme.textMain} leading-tight`}>
            {activeChild.full_name}
          </h1>
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
        {/* QR & PIN SECTION */}
        <section
          className={`${theme.card} rounded-[2.5rem] p-8 shadow-xl border ${theme.border} text-center`}
        >
          <p
            className={`text-[10px] font-black ${theme.textSub} uppercase tracking-[0.2em] mb-6`}
          >
            {activeChild.is_on_bus
              ? "Drop-off Token (Active)"
              : "Pickup Token (Pending)"}
          </p>
          <div className="inline-block p-4 bg-white rounded-3xl mb-6 shadow-sm">
            <QRCodeSVG
              value={activeChild.handover_token || activeChild.id}
              size={160}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="flex gap-2 justify-center">
            {guardianPin.split("").map((char, i) => (
              <div
                key={i}
                className={`w-10 h-14 ${theme.inner} rounded-xl flex items-center justify-center text-2xl font-black ${theme.textMain} border ${theme.border}`}
              >
                {char}
              </div>
            ))}
          </div>
        </section>

        {/* LIVE MAP SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className={`font-black ${theme.textMain} text-sm uppercase`}>
              Live Tracking
            </h3>
            <span
              className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full ${activeChild.is_on_bus ? "text-emerald-600 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10"}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${activeChild.is_on_bus ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`}
              />
              {activeChild.is_on_bus ? "ON BOARD" : "WAITING"}
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
                  `https://www.google.com/maps?q=${activeChild.lat},${activeChild.lng}`,
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
