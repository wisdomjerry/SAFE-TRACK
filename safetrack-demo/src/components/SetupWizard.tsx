import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  LayoutDashboard,
  Truck,
  UserPlus,
  Users,
  CheckCircle2,
  RefreshCcw,
  ExternalLink,
  Loader2,
} from "lucide-react";

const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSyncStatus = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/api/school/summary");
      if (res.data.success) {
        setData(res.data.data);

        const stats = res.data.data;
        if (
          stats.totalVans > 0 &&
          stats.totalDrivers > 0 &&
          stats.totalStudents > 0
        ) {
          setTimeout(onComplete, 1500);
        }
      }
    } catch (err) {
      console.error("Error checking sync status", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const steps = [
    {
      id: "totalVans",
      title: "Fleet Synchronization",
      desc: "Checking for vehicles...",
      icon: <Truck size={20} />,
      count: data?.totalVans || 0,
    },
    {
      id: "totalDrivers",
      title: "Driver Assignment",
      desc: "Looking for driver profiles...",
      icon: <UserPlus size={20} />,
      count: data?.totalDrivers || 0,
    },
    {
      id: "totalStudents",
      title: "Student Roster",
      desc: "Mapping route students...",
      icon: <Users size={20} />,
      count: data?.totalStudents || 0,
    },
  ];

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Pinging Database...
        </p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto py-8 md:py-16 px-5 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Icon Header - Scaled down for mobile */}
      <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-3xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-blue-500/20">
        <LayoutDashboard size={32} className="md:w-10 md:h-10" color="white" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] mb-3 tracking-tighter">
        Google Sheets Sync
      </h1>
      <p className="text-gray-500 mb-8 md:mb-12 font-medium text-sm md:text-base px-2">
        We are detecting data from your connected spreadsheet. Please ensure all
        tabs are populated.
      </p>

      {/* Steps List - Reduced gap and padding for mobile */}
      <div className="grid gap-3 md:gap-4">
        {steps.map((item) => {
          const isDone = item.count > 0;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-white border rounded-3xl md:rounded-3xl transition-all text-left w-full ${
                isDone
                  ? "border-emerald-100 bg-emerald-50/30"
                  : "border-gray-100 shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {isDone ? <CheckCircle2 size={20} className="md:w-6 md:h-6" /> : item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {isDone ? "Synced" : "Pending"}
                  </span>
                </div>
                <h3
                  className={`font-bold text-sm md:text-lg mt-0.5 truncate ${isDone ? "text-gray-500" : "text-[#0f172a]"}`}
                >
                  {item.title}
                </h3>
                <p className="text-[11px] md:text-sm text-gray-400 font-medium truncate">
                  {isDone
                    ? `Found ${item.count} items in database.`
                    : item.desc}
                </p>
              </div>

              {!isDone && (
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons - Adjusted for thumb reach on mobile */}
      <div className="mt-8 md:mt-12 flex flex-col items-center gap-5">
        <button
          onClick={fetchSyncStatus}
          disabled={refreshing}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#0f172a] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw size={18} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Checking..." : "Refresh Sync Status"}
        </button>

        {data?.google_sheet_url ? (
          <a
            href={data.google_sheet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs md:text-sm font-black text-blue-600 uppercase tracking-wider hover:text-blue-800 transition-colors"
          >
            Open Management Sheet <ExternalLink size={14} />
          </a>
        ) : (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
            Generating Sheet Link...
          </p>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;