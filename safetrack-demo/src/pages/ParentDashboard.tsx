import { useEffect, useState, useCallback, useRef } from "react";
import axios from "../api/axios";
import { supabase } from "../config/supabaseClient";
import LiveMap from "../components/LiveMap";
import {
  GraduationCap,
  MapPin,
  Navigation,
  ShieldCheck,
  QrCode,
  Save,
  RefreshCw,
  CheckCircle2,
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
  is_on_bus: boolean;
  status: string;
  lat: number;
  lng: number;
  current_speed: number;
  current_location_name: string;
  heading: number;
  driver_name?: string;
  driver_phone?: string;
}

interface VanUpdate {
  id: string;
  current_lat: number;
  current_lng: number;
  current_speed: number;
  current_location_name: string;
  heading: number;
  status: string;
}

const ParentDashboard = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardianPin, setGuardianPin] = useState("");
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const prevIsOnBusRef = useRef<boolean>(false);

  // -----------------------------
  // LOAD INITIAL CHILD DATA
  // -----------------------------
  const loadData = useCallback(async () => {
    try {
      const res = await axios.get("/api/parents/children");
      const childrenData: Child[] = res.data.data || [];
      setChildren(childrenData);

      if (childrenData.length > 0) {
        const activeChild = childrenData[0];
        setGuardianPin(activeChild.guardian_pin || "");
        prevIsOnBusRef.current = activeChild.is_on_bus;

        // Fetch historical van route
        const { data: history } = await supabase
          .from("van_location_history")
          .select("lat, lng")
          .eq("van_id", activeChild.van_id)
          .order("created_at", { ascending: true })
          .limit(100);

        if (history && history.length > 0) {
          setRoutePath(history.map((h) => [h.lat, h.lng]));
        } else if (activeChild.lat && activeChild.lng) {
          setRoutePath([[activeChild.lat, activeChild.lng]]);
        }
      }
    } catch (err: any) {
      console.error("❌ [Dashboard] API Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -----------------------------
  // PIN HELPERS
  // -----------------------------
  const generateRandomPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGuardianPin(newPin);
  };

  const autoRotatePin = async (studentId: string) => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGuardianPin(newPin);
    try {
      await axios.patch(`/api/parents/students/${studentId}/guardian-pin`, {
        guardian_pin: newPin,
      });
      console.log("🔄 Security Handshake: Drop-off PIN auto-generated.");
    } catch (err) {
      console.error("Auto-rotation failed", err);
    }
  };

  const handleSavePin = async (studentId: string) => {
    try {
      await axios.patch(`/api/parents/students/${studentId}/pin`, {
        guardian_pin: guardianPin,
      });
      alert("✅ Security PIN & QR updated successfully!");
    } catch (err) {
      alert("❌ Failed to update PIN.");
    }
  };

  // -----------------------------
  // REAL-TIME SUBSCRIPTIONS
  // -----------------------------
  useEffect(() => {
    if (children.length === 0) return;

    // 1️⃣ Monitor Van Movement
    const vanChannel = supabase
      .channel("live-van-tracking")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vans" },
        (payload) => {
          const newData = payload.new as VanUpdate;
          setChildren((current) =>
            current.map((child) =>
              child.van_id === newData.id
                ? {
                    ...child,
                    current_speed: newData.current_speed,
                    current_location_name: newData.current_location_name,
                    lat: newData.current_lat,
                    lng: newData.current_lng,
                    heading: newData.heading,
                  }
                : child,
            ),
          );

          setRoutePath((prev) => {
            const last = prev[prev.length - 1];
            const next: [number, number] = [
              newData.current_lat,
              newData.current_lng,
            ];
            if (last && last[0] === next[0] && last[1] === next[1]) return prev;
            return [...prev, next];
          });
        },
      )
      .subscribe();

    // 2️⃣ Monitor Student Status (Pickup/Dropoff)
    const studentChannel = supabase
      .channel("student-status-monitor")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students" },
        (payload) => {
          const updatedFields = payload.new as Child;

          // Detect transition to "Picked Up"
          const justBoarded =
            !prevIsOnBusRef.current &&
            (updatedFields.is_on_bus === true ||
              updatedFields.status === "picked_up");

          // 🛡️ Safety Guard: Only rotate if it's currently "Working Hours" (6 AM - 6 PM)
          // This prevents the PIN from rotating if the midnight reset changes student data.
          const isSchoolHours =
            new Date().getHours() >= 6 && new Date().getHours() <= 18;

          if (justBoarded && isSchoolHours) {
            console.log("🔄 Boarding detected! Rotating PIN for Drop-off...");
            autoRotatePin(updatedFields.id);
          }

          prevIsOnBusRef.current = updatedFields.is_on_bus;

          setChildren((current) =>
            current.map((child) =>
              child.id === updatedFields.id
                ? { ...child, ...updatedFields }
                : child,
            ),
          );

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
  }, [children]);

  // -----------------------------
  // RENDER
  // -----------------------------
  if (loading) return <LoadingSpinner />;
  if (children.length === 0)
    return (
      <div className="p-10 text-center text-gray-400">No students linked.</div>
    );

  const activeChild = children[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-6 bg-slate-50/50 min-h-screen">
      {/* Profile Header */}
      <ProfileHeader child={activeChild} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QRCodeCard child={activeChild} guardianPin={guardianPin} />
            <HandoverCard
              child={activeChild}
              guardianPin={guardianPin}
              generateRandomPin={generateRandomPin}
              handleSavePin={handleSavePin}
            />
          </div>

          <MapCard child={activeChild} routePath={routePath} />

          {/* --- DRIVER INFO --- */}
          <DriverInfoCard child={activeChild} />
        </div>

        <TimelineSidebar child={activeChild} />
      </div>
    </div>
  );
};

// -----------------------------
// DRIVER INFO CARD
// -----------------------------
const DriverInfoCard = ({ child }: { child: Child }) => (
  <div className="bg-white p-6 mt-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
        {child.driver_name
          ? child.driver_name
              .split(" ")
              .map((n) => n[0])
              .join("")
          : "?"}
      </div>
      {child.is_on_bus && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-ping"></span>
      )}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-slate-800">Driver on Duty</h4>
      <p className="text-xs text-slate-500">
        {child.driver_name || "No driver assigned"}
      </p>
      {child.driver_phone && (
        <p className="text-xs text-blue-600 font-mono">
          📞 {child.driver_phone}
        </p>
      )}
      {child.is_on_bus && (
        <p className="text-[10px] uppercase font-bold text-green-500 tracking-wide mt-1">
          Live on Route
        </p>
      )}
    </div>
  </div>
);

// -----------------------------
// SUBCOMPONENTS
// -----------------------------
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center font-bold text-blue-600 bg-slate-50">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse">Loading Dashboard...</p>
    </div>
  </div>
);

const ProfileHeader = ({ child }: { child: Child }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
        {child.full_name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")}
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-800">{child.full_name}</h1>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <GraduationCap size={14} />
          <span>
            Grade {child.grade} • {child.school_name}
          </span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
      <div
        className={`w-2 h-2 rounded-full ${child.is_on_bus ? "bg-green-500 animate-ping" : "bg-slate-300"}`}
      ></div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
        {child.status === "dropped_off"
          ? "Home Safe"
          : child.is_on_bus
            ? "Live on Route"
            : "Waiting for Pickup"}
      </span>
    </div>
  </div>
);

const QRCodeCard = ({
  child,
  guardianPin,
}: {
  child: Child;
  guardianPin: string;
}) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-80">
    {child.status === "dropped_off" ? (
      <div className="text-center space-y-4 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={42} />
        </div>
        <h3 className="font-black text-slate-800 text-lg">Trip Completed</h3>
        <p className="text-slate-500 text-sm">
          Child has been safely dropped off.
        </p>
      </div>
    ) : (
      <>
        <div className="flex items-center gap-2 mb-4 self-start">
          <QrCode
            size={18}
            className={child.is_on_bus ? "text-emerald-600" : "text-blue-600"}
          />
          <h3 className="font-bold text-slate-800 text-sm">
            {child.is_on_bus ? "Step 2: Drop-off Pass" : "Step 1: Pickup Pass"}
          </h3>
        </div>
        <div
          className={`p-4 bg-white rounded-2xl border-2 border-dashed mb-4 transition-all duration-500 ${child.is_on_bus ? "border-emerald-200" : "border-blue-200"}`}
        >
          <QRCodeSVG
            value={`VERIFY|ID:${child.id}|PIN:${guardianPin}|ACTION:${child.is_on_bus ? "dropped_off" : "picked_up"}`}
            size={140}
            level="H"
          />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">
            Guardian PIN
          </p>
          <p
            className={`text-2xl font-black tracking-[0.2em] transition-colors ${child.is_on_bus ? "text-emerald-600" : "text-blue-600"}`}
          >
            {guardianPin || "------"}
          </p>
        </div>
      </>
    )}
  </div>
);

const HandoverCard = ({
  child,
  guardianPin,
  generateRandomPin,
  handleSavePin,
}: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
          <ShieldCheck size={20} />
        </div>
        <h3 className="font-bold text-slate-800">Caretaker Handover</h3>
      </div>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        {child.is_on_bus
          ? "New PIN generated for drop-off. Share this with the person receiving the child."
          : "Provide this 6-digit code to the driver for morning pickup."}
      </p>
    </div>
    <div className="space-y-3">
      <button
        onClick={generateRandomPin}
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:bg-slate-100 transition-all"
      >
        <RefreshCw size={16} /> Force Refresh PIN
      </button>
      <button
        onClick={() => handleSavePin(child.id)}
        disabled={guardianPin.length !== 6}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition-all ${guardianPin.length === 6 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}
      >
        <Save size={18} /> Save & Sync
      </button>
    </div>
  </div>
);

const MapCard = ({ child, routePath }: any) => (
  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden relative">
    <div className="h-112.5 w-full relative z-0">
      <LiveMap
        lat={child.lat}
        lng={child.lng}
        isOnBus={child.is_on_bus}
        heading={child.heading}
        routePath={routePath}
      />
    </div>
    <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white shadow-2xl flex justify-between items-center z-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <MapPin size={18} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-black text-slate-400">
            Current Street
          </p>
          <p className="text-sm font-bold text-slate-700">
            {child.current_location_name || "Awaiting GPS..."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-[10px] uppercase font-black text-slate-400">
            Live Speed
          </p>
          <p className="text-sm font-bold text-blue-600">
            {child.current_speed || 0} km/h
          </p>
        </div>
        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
          <Navigation size={18} />
        </div>
      </div>
    </div>
  </div>
);

const TimelineSidebar = ({ child }: { child: Child }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
    <h3 className="text-lg font-black text-slate-800 mb-8">Trip Timeline</h3>
    <div className="space-y-2 relative">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100"></div>
      <SchedulePoint
        time="Morning Pickup"
        label="Child Boarded"
        sub="Pickup completed"
        status={
          child.is_on_bus || child.status === "dropped_off"
            ? "complete"
            : "pending"
        }
      />
      <SchedulePoint
        time="ETA 08:15 AM"
        label="School Drop-off"
        sub={child.school_name}
        status={
          child.status === "dropped_off"
            ? "complete"
            : child.is_on_bus
              ? "active"
              : "pending"
        }
      />
    </div>
  </div>
);

const SchedulePoint = ({
  time,
  label,
  sub,
  status,
}: {
  time: string;
  label: string;
  sub: string;
  status: "complete" | "active" | "pending";
}) => (
  <div className="flex gap-4 relative">
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center relative z-10 shrink-0 ${status === "complete" ? "bg-green-100 border-green-500" : status === "active" ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"}`}
    >
      {status === "complete" && (
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      )}
      {status === "active" && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
    <div className="pb-8">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        {time}
      </p>
      <p className="font-bold text-[#1d1c1d] text-sm">{label}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  </div>
);

export default ParentDashboard;
