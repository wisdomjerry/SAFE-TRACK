import { useState, useEffect } from "react";
import api from "../api/axios";
import { Bus, User, Map, AlertCircle, RefreshCw, Smartphone, TrendingUp } from "lucide-react";

const VansRoutesPage = () => {
  const [vans, setVans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchVans = async () => {
    setIsSyncing(true);
    try {
      const res = await api.get("/api/school/vans-detail");
      if (res.data.success) {
        setVans(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching fleet data:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchVans();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Fleet Monitor</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
              {vans.length} Vehicles Online
            </p>
          </div>
        </div>
        <button 
          onClick={fetchVans}
          disabled={isSyncing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={18} className={isSyncing ? "animate-spin text-blue-600" : ""} />
          {isSyncing ? "Updating..." : "Refresh Fleet"}
        </button>
      </div>

      {/* Capacity Alert (Conditional) */}
      {vanAlerts(vans)}

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-80 rounded-3xl animate-pulse border border-slate-100" />
          ))
        ) : vans.length > 0 ? (
          vans.map((van: any) => {
            const occupancyRate = (van.studentCount / van.capacity) * 100;
            const isFull = van.studentCount >= van.capacity;
            const isCritical = van.studentCount > van.capacity;

            return (
              <div key={van.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                {/* Status Banner */}
                <div className={`h-1.5 w-full ${van.status === 'active' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                      <Bus size={24} />
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        van.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {van.status}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center justify-end gap-1">
                        <Smartphone size={10} /> GPS ACTIVE
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-900">{van.plate_number}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <TrendingUp size={12} className="text-blue-500" />
                      {van.model || "Standard Van"}
                    </div>
                  </div>

                  {/* Occupancy Progress Section */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Load Factor</span>
                      <span className={`text-sm font-black ${isCritical ? "text-red-600" : isFull ? "text-orange-500" : "text-blue-600"}`}>
                        {van.studentCount} / {van.capacity} <span className="text-[10px] opacity-60">Students</span>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${isCritical ? 'bg-red-500' : isFull ? 'bg-orange-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver & Route Info */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><User size={16} /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Driver</p>
                        <p className="text-[11px] font-bold text-slate-800 truncate">{van.drivers?.full_name?.split(' ')[0] || "None"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Map size={16} /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Route</p>
                        <p className="text-[11px] font-bold text-slate-800 truncate">{van.route_name || "Syncing"}</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-6 py-3.5 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-md active:scale-95">
                    View Full Analytics
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-4xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
            <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-300">
              <Bus size={48} />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Vehicles Registered</h3>
            <p className="text-sm text-slate-400 max-w-xs mt-1 font-medium">Add vans to your fleet to begin monitoring student routes and safety metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const vanAlerts = (vans: any[]) => {
  const overCapacity = vans.filter(v => v.studentCount > v.capacity);
  if (overCapacity.length === 0) return null;

  return (
    <div className="bg-red-600 p-5 rounded-4xl flex flex-col sm:flex-row items-center gap-4 text-white shadow-xl shadow-red-200 animate-in slide-in-from-top duration-500">
      <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
        <AlertCircle size={24} />
      </div>
      <div className="text-center sm:text-left flex-1">
        <p className="text-sm font-black uppercase tracking-widest">Safety Warning: Over Capacity</p>
        <p className="text-xs font-medium opacity-90">
          {overCapacity.length} vehicle(s) are currently carrying more students than their legal capacity. This is a safety violation.
        </p>
      </div>
      <button className="px-6 py-2 bg-white text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
        Take Action
      </button>
    </div>
  );
};

export default VansRoutesPage;