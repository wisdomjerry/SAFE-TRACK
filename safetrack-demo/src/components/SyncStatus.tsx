import { Database, CheckCircle2, RefreshCw } from "lucide-react";

const SyncStatus = ({ lastSync }: { lastSync?: string }) => {
  return (
    <div className="mx-4 mt-auto mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Database size={14} className="text-blue-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse border border-[#1d1c1d]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Sheet Sync
          </span>
        </div>
        <CheckCircle2 size={12} className="text-emerald-500" />
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold text-white/40 italic">
          {lastSync ? `Updated ${lastSync}` : "Live Connection"}
        </p>
        <RefreshCw size={10} className="text-white/20 animate-spin-slow" />
      </div>
    </div>
  );
};

export default SyncStatus;