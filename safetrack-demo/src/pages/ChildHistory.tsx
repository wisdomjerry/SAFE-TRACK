import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Calendar, MapPin, ArrowUpRight, ArrowDownRight, ChevronLeft, Clock, ShieldCheck } from "lucide-react";

const ChildHistory = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!studentId || studentId === "undefined") return;
      try {
        setLoading(true);
        const res = await api.get(`/api/parents/history/${studentId}`);
        setHistory(res.data.data);
      } catch (err) {
        console.error("History fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [studentId]);

  if (!studentId || studentId === 'undefined' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Securing Records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Navigation & Header */}
      <div className="space-y-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm"
        >
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-4xl shadow-xl shadow-slate-200">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Activity Log</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-500" /> Verified Safety Records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="relative space-y-6">
        {history.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Clock size={32} />
            </div>
            <p className="text-slate-400 font-bold text-sm">No activity recorded for this period.</p>
          </div>
        ) : (
          <div className="relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {history.map((log, _index) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon Circle */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-white shadow-md z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform group-hover:scale-110 ${
                  log.type === "pickup" ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                }`}>
                  {log.type === "pickup" ? <ArrowUpRight size={20} strokeWidth={3} /> : <ArrowDownRight size={20} strokeWidth={3} />}
                </div>

                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <time className="font-black text-slate-900 text-lg tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </time>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                       log.type === "pickup" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    }`}>
                      {log.type}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        {log.location_name || "School Designated Zone"}
                      </p>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildHistory;