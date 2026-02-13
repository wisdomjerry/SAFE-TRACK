import { useState, useEffect, useRef } from "react";
import { Bell, Hash, Inbox, Sparkles, CheckCheck, Megaphone, AlertTriangle, Clock } from "lucide-react";
import api from "../api/axios";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("Workspace");
  
  const audioPlayer = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [notifRes, userRes] = await Promise.all([
          api.get("/api/auth/notifications"),
          api.get("/api/auth/me")
        ]);

        const newNotifs = notifRes.data.data || [];
        
        if (newNotifs.length > notifications.length && !loading) {
          audioPlayer.current.play().catch(_e => console.log("Audio play blocked"));
        }

        setNotifications(newNotifs);
        setSchoolName(userRes.data.data?.school_name || "My School");
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/api/auth/notifications/read");
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 min-h-100">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Bell className="absolute inset-0 m-auto text-blue-600/20" size={16} />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connecting to {schoolName}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white max-w-4xl mx-auto shadow-2xl shadow-slate-200/50 min-h-screen border-x border-slate-100">
      {/* Dynamic Header */}
      <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg text-white">
            <Hash size={18} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">driver-alerts</h1>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{schoolName}</span>
          </div>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllRead}
            className="group flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest border border-slate-100"
          >
            <CheckCheck size={14} className="group-hover:scale-110 transition-transform" />
            Mark All Read
          </button>
        )}
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`relative flex gap-4 p-6 transition-all hover:bg-slate-50/50 ${!n.is_read ? "bg-blue-50/30" : ""}`}
              >
                {/* Unread Indicator Bar */}
                {!n.is_read && (
                  <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-blue-600 rounded-r-full shadow-[2px_0_8px_rgba(37,99,235,0.3)]" />
                )}

                {/* Avatar / Icon Section */}
                <div className="shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${
                      n.type === "urgent" 
                      ? "bg-rose-500 shadow-rose-100 animate-pulse" 
                      : "bg-slate-800 shadow-slate-100"
                  }`}>
                    {n.type === "urgent" ? <AlertTriangle size={20} /> : (n.sender_name?.[0] || <Megaphone size={20} />)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!n.is_read ? "font-black text-slate-900" : "font-bold text-slate-500"}`}>
                        {n.sender_name || "System Broadcast"}
                      </span>
                      {n.type === "urgent" && (
                        <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Urgent</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                      <Clock size={10} />
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div className={`text-sm leading-relaxed p-4 rounded-2xl border transition-all ${
                    !n.is_read 
                    ? "bg-white border-blue-100 text-slate-800 shadow-sm ring-1 ring-blue-50" 
                    : "bg-transparent border-slate-100 text-slate-500"
                  }`}>
                    <strong className={`block mb-1 text-xs uppercase tracking-wide ${!n.is_read ? "text-blue-600" : "text-slate-500"}`}>
                      {n.title}
                    </strong>
                    {n.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-12 mt-20">
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-blue-50 rounded-full animate-ping opacity-20" />
              <div className="relative bg-white p-10 rounded-[2.5rem] border-2 border-slate-50 shadow-xl shadow-slate-100">
                <Inbox size={64} className="text-slate-200" strokeWidth={1} />
                <Sparkles className="absolute -top-2 -right-2 text-amber-400" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero interruptions.</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-60 font-medium leading-relaxed">
              Your inbox is clear. New alerts for <span className="text-blue-600 font-bold">{schoolName}</span> will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Protocol v2.4</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;