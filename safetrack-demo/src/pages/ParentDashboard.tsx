import { useEffect, useState, useCallback, useRef } from "react";
import axios from "../api/axios";
import { supabase } from "../config/supabaseClient";
import LiveMap from "../components/LiveMap";
import {
  Bell,
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon
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
}

interface HistoryLog {
  id: string;
  type: 'pickup' | 'dropoff';
  status: string;
  created_at: string;
  location_name: string;
  van_name?: string;
}

const ParentDashboard = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]); // Added history state
  const [loading, setLoading] = useState(true);
  const [guardianPin, setGuardianPin] = useState("");
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const prevIsOnBusRef = useRef<boolean>(false);

  const theme = {
    bg: isDarkMode ? 'bg-[#0F0F10]' : 'bg-[#F4F7FA]',
    card: isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white',
    textMain: isDarkMode ? 'text-white' : 'text-slate-900',
    textSub: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-white/5' : 'border-slate-100',
    inner: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
  };

  const loadData = useCallback(async () => {
    try {
      const res = await axios.get("/api/parents/children");
      const childrenData: Child[] = res.data.data || [];
      setChildren(childrenData);

      if (childrenData.length > 0) {
        const activeChild = childrenData[0];
        setGuardianPin(activeChild.guardian_pin || "");
        prevIsOnBusRef.current = activeChild.is_on_bus;

        // Fetch History from Backend
        try {
          const historyRes = await axios.get(`/api/parents/history/${activeChild.id}`);
          if (historyRes.data.success) {
            setHistoryLogs(historyRes.data.data);
          }
        } catch (hErr) {
          console.error("❌ History fetch error:", hErr);
        }

        const { data: history } = await supabase
          .from("van_location_history")
          .select("lat, lng")
          .eq("van_id", activeChild.van_id)
          .order("created_at", { ascending: true })
          .limit(100);

        if (history && history.length > 0) {
          setRoutePath(history.map((h) => [h.lat, h.lng]));
        }
      }
    } catch (err) {
      console.error("❌ API Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  useEffect(() => {
    if (children.length === 0) return;

    const vanChannel = supabase
      .channel("live-van-tracking")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vans" }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newData = payload.new as any;
        setChildren(current => current.map(child => 
          child.van_id === newData.id ? { ...child, lat: newData.current_lat, lng: newData.current_lng, current_speed: newData.current_speed, current_location_name: newData.current_location_name } : child
        ));
        setRoutePath(prev => [...prev, [newData.current_lat, newData.current_lng]]);
      }).subscribe();

    const studentChannel = supabase
      .channel("student-status-monitor")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "students" }, (payload) => {
        const updatedFields = payload.new as Child;
        const justBoarded = !prevIsOnBusRef.current && (updatedFields.is_on_bus || updatedFields.status === "picked_up");
        if (justBoarded) autoRotatePin(updatedFields.id);
        prevIsOnBusRef.current = updatedFields.is_on_bus;
        setChildren(current => current.map(c => c.id === updatedFields.id ? { ...c, ...updatedFields } : c));
        if (updatedFields.guardian_pin) setGuardianPin(updatedFields.guardian_pin);
      }).subscribe();

    return () => {
      supabase.removeChannel(vanChannel);
      supabase.removeChannel(studentChannel);
    };
  }, [children]);

  if (loading) return <div className={`h-screen flex items-center justify-center ${theme.bg} font-black text-blue-600 animate-pulse`}>Safetrack Live...</div>;

  const activeChild = children[0];

  return (
    <div className={`${theme.bg} min-h-screen pb-32 transition-colors duration-300`}>
      <header className={`${theme.card} backdrop-blur-md sticky top-0 z-40 px-6 pt-10 pb-6 flex justify-between items-start border-b ${theme.border}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
             <ShieldCheck size={20} className="text-blue-600" />
             <span className={`text-sm font-bold ${theme.textMain} tracking-tight`}>SafeTrack</span>
          </div>
          <p className={`${theme.textSub} text-xs font-medium`}>Good Morning,</p>
          <h1 className={`text-2xl font-black ${theme.textMain} leading-tight`}>{activeChild?.full_name}</h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-10 h-10 ${theme.inner} border ${theme.border} rounded-xl flex items-center justify-center`}
            >
                {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-600" />}
            </button>
            <button className={`w-10 h-10 ${theme.inner} border ${theme.border} rounded-xl flex items-center justify-center relative`}>
                <Bell size={18} className={theme.textSub} />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-8">
        <section className="relative group">
           <div className="absolute inset-0 bg-blue-600/5 blur-3xl -z-10 rounded-full" />
           <div className={`${theme.card} rounded-[2.5rem] p-8 shadow-xl border ${theme.border} text-center relative overflow-hidden`}>
              <p className={`text-[10px] font-black ${theme.textSub} uppercase tracking-[0.2em] mb-6`}>
                {activeChild?.is_on_bus ? "Drop-off Authentication" : "Pickup Authentication"}
              </p>
              
              <div className="inline-block p-4 bg-white rounded-3xl border border-slate-100 mb-6 shadow-sm relative">
                 <QRCodeSVG 
                   value={activeChild?.handover_token || activeChild?.id || "N/A"} 
                   size={150}
                   level="H"
                 />
              </div>

              <div className="flex flex-col items-center">
                 <p className={`text-[10px] font-bold ${theme.textSub} mb-3`}>One-Time PIN</p>
                 <div className="flex gap-3">
                   {guardianPin.split('').map((char, i) => (
                     <div key={i} className={`w-10 h-14 ${theme.inner} rounded-xl flex items-center justify-center text-2xl font-black ${theme.textMain} border ${theme.border} shadow-inner`}>
                       {char}
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className={`font-black ${theme.textMain} text-sm uppercase tracking-tight`}>Live Route</h3>
            {activeChild?.is_on_bus && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                ON BOARD
              </span>
            )}
          </div>
          <div className={`${theme.card} rounded-[2.5rem] p-2 shadow-lg border ${theme.border} overflow-hidden`}>
             <div className="h-56 w-full rounded-[2.2rem] overflow-hidden">
                <LiveMap 
                  lat={activeChild?.lat} 
                  lng={activeChild?.lng} 
                  isOnBus={activeChild?.is_on_bus} 
                  routePath={routePath}
                  heading={activeChild?.heading}
                />
             </div>
             <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'} flex items-center justify-center text-blue-600`}>
                      <MapPin size={20} />
                   </div>
                   <div>
                      <p className={`text-[10px] ${theme.textSub} font-black uppercase tracking-tighter`}>Current Location</p>
                      <p className={`text-xs font-bold ${theme.textMain} truncate max-w-45`}>
                        {activeChild?.current_location_name || "Locating vehicle..."}
                      </p>
                   </div>
                </div>
                <a href={`tel:${activeChild?.driver_phone}`} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                   <Phone size={18} />
                </a>
             </div>
          </div>
        </section>

        {/* HISTORY SECTIONS - Linked to real historyLogs */}
        <div className="space-y-6">
           <HistorySection 
             title="Pickup History" 
             theme={theme} 
             logs={historyLogs} 
             typeFilter="pickup" 
           />
           <HistorySection 
             title="Drop-off History" 
             theme={theme} 
             logs={historyLogs} 
             typeFilter="dropoff" 
           />
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HistorySection = ({ title, theme, logs, typeFilter }: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredLogs = logs.filter((log: any) => log.type === typeFilter);

  return (
    <section>
      <div className="flex justify-between items-center mb-4 px-2">
          <h3 className={`font-black ${theme.textMain} text-sm`}>{title}</h3>
          <button className="text-blue-600 text-[10px] font-bold uppercase">View All</button>
      </div>
      <div className={`${theme.card} rounded-4xl p-2 space-y-1 shadow-sm border ${theme.border}`}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log: HistoryLog) => (
              <HistoryItem 
                key={log.id}
                icon={log.type === 'pickup' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <MapPin size={14} className="text-blue-600" />}
                title={log.location_name || (log.type === 'pickup' ? "School Pickup" : "Home Drop-off")}
                time={new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                bus={log.van_name || "Assigned Van"}
                status={log.status || "Verified"}
                statusColor={log.status === 'delayed' ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10"}
                theme={theme}
              />
            ))
          ) : (
            <div className="p-6 text-center text-xs opacity-50 font-medium">No history available</div>
          )}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HistoryItem = ({ icon, title, time, bus, status, statusColor, theme }: any) => (
  <div className={`flex items-center justify-between p-4 ${theme.inner} rounded-3xl group mb-1`}>
     <div className="flex items-center gap-4">
        <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white/5`}>
           {icon}
        </div>
        <div>
           <h4 className={`text-sm font-bold ${theme.textMain}`}>{title}</h4>
           <p className={`text-[10px] ${theme.textSub} font-medium`}>{time} • {bus}</p>
        </div>
     </div>
     <div className="flex items-center gap-3">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusColor}`}>
           {status}
        </span>
        <ChevronRight size={16} className={`${theme.textSub} opacity-30 group-hover:text-blue-400 transition-colors`} />
     </div>
  </div>
);

export default ParentDashboard;