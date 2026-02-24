import React, { useState } from "react";
import api from "../api/axios";
import { Send, AlertCircle, Info, CheckCircle2, Megaphone, Eye } from "lucide-react";

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
  });
  const [loading, setLoading] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/notifications", formData);
      setSentStatus(true);
      setFormData({ title: "", message: "", type: "info" });
      setTimeout(() => setSentStatus(false), 3000); // Reset success state after 3s
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeConfig: any = {
    info: { icon: <Info size={16} />, color: "bg-blue-600", light: "bg-blue-50", text: "text-blue-600" },
    urgent: { icon: <AlertCircle size={16} />, color: "bg-rose-600", light: "bg-rose-50", text: "text-rose-600" },
    success: { icon: <CheckCircle2 size={16} />, color: "bg-emerald-600", light: "bg-emerald-50", text: "text-emerald-600" },
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
      {/* Form Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Broadcast Center</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alert all active drivers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority Level</label>
            <div className="flex gap-2">
              {Object.keys(typeConfig).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t })}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tighter transition-all ${
                    formData.type === t
                      ? `${typeConfig[t].color} text-white border-transparent shadow-lg scale-[1.02]`
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {typeConfig[t].icon}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <input
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold placeholder:text-slate-300"
              placeholder="Headline (e.g. Traffic Delay)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-40 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium placeholder:text-slate-300 resize-none"
              placeholder="Type your detailed message here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <button
            disabled={loading || sentStatus}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              sentStatus 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-900 text-white hover:bg-blue-600 active:scale-95 shadow-xl shadow-blue-100 disabled:bg-slate-200"
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sentStatus ? (
              <>
                <CheckCircle2 size={18} /> Broadcast Sent
              </>
            ) : (
              <>
                <Send size={18} /> Dispatch To All Units
              </>
            )}
          </button>
        </form>
      </div>

      {/* Preview Section - Highly engaging for the Admin */}
      <div className="hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Eye size={16} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver Feed Preview</span>
        </div>
        
        <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex-1 flex items-center justify-center relative overflow-hidden">
          {formData.title || formData.message ? (
             <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${typeConfig[formData.type].color}`}>
                    {typeConfig[formData.type].icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase leading-none">Dispatcher</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Just Now</p>
                  </div>
                </div>
                <h4 className={`text-sm font-black mb-1 ${typeConfig[formData.type].text}`}>
                  {formData.title || "Headline Goes Here"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{formData.message || "Your message content will appear here for all drivers to see..."}"
                </p>
             </div>
          ) : (
            <div className="text-center space-y-2 opacity-30">
              <Megaphone size={48} className="mx-auto text-slate-400" />
              <p className="text-xs font-black uppercase tracking-widest">Awaiting Content</p>
            </div>
          )}
          
          {/* Decorative Phone Frame Edge */}
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;