import { useState, useEffect } from "react";
import api from "../api/axios";
import { Search, Phone, Star, ClipboardList, MoreVertical, Plus, ShieldCheck, Mail } from "lucide-react";

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await api.get("/api/school/drivers-detail");
        if (res.data.success) setDrivers(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter((d: any) =>
    d.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Personnel Directory</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> Fully Vetted Drivers
          </p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-slate-200 active:scale-95">
          <Plus size={18} strokeWidth={3} /> Register Driver
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-4xl border border-slate-200 shadow-sm ring-4 ring-slate-50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, plate number, or status..."
            className="w-full pl-12 pr-6 py-4 bg-transparent border-none rounded-2xl focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-400"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />
          ))
        ) : filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver: any) => (
            <div key={driver.id} className="bg-white p-4 md:p-6 rounded-4xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-blue-200 transition-all group">
              
              {/* Profile & Identity */}
              <div className="flex items-center gap-4 w-full md:w-1/4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl border-2 border-white shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {driver.full_name.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${driver.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{driver.full_name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-tighter">
                      {driver.vans?.plate_number || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Contact Controls */}
              <div className="flex items-center gap-3 w-full md:w-1/4">
                <a href={`tel:${driver.phone_number}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                  <Phone size={18} />
                  <span className="text-xs font-black md:hidden">Call</span>
                </a>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                  <Mail size={18} />
                  <span className="text-xs font-black md:hidden">Message</span>
                </button>
                <span className="hidden md:block text-sm font-black text-slate-600 tabular-nums">{driver.phone_number}</span>
              </div>

              {/* Performance Stats */}
              <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Safety Rating</p>
                  <div className="flex items-center justify-center gap-1 text-amber-500 font-black">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm">{driver.rating || "5.0"}</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-100 hidden md:block" />
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Trips</p>
                  <div className="flex items-center justify-center gap-1 text-slate-900 font-black">
                    <ClipboardList size={14} className="text-blue-500" />
                    <span className="text-sm">{driver.total_trips || 0}</span>
                  </div>
                </div>
                
                <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
            <p className="text-slate-400 font-bold italic">No drivers found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversPage;