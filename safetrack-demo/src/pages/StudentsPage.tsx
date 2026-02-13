import { useState, useEffect } from "react";
import api from "../api/axios";
import { Search, Plus, MoreVertical, Filter, RefreshCw, Phone, GraduationCap } from "lucide-react";

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStudents = async () => {
    setIsSyncing(true);
    if (students.length === 0) setLoading(true);

    try {
      const res = await api.get("/api/school/students");
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching students", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (s: any) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-(--突破-7xl) mx-auto">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Students Directory
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {filteredStudents.length} Registered Students
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 uppercase tracking-wide">
              <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Live Connection"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStudents}
            disabled={isSyncing}
            className="flex-1 sm:flex-none flex items-center justify-center p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200 bg-white"
          >
            <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
          </button>
          <button className="flex-3 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-lg shadow-blue-100 text-xs uppercase tracking-widest">
            <Plus size={18} strokeWidth={3} /> Register Student
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search student or parent name..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 text-sm transition-colors w-full md:w-auto bg-white">
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Mobile-First Content: Cards on Mobile, Table on Desktop */}
      <div className="bg-white md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent / Contact</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Van & Route</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <TableSkeleton /> : filteredStudents.map((student: any) => (
                <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-100">
                        {student.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-slate-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">{student.class || "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-slate-800">{student.parent_name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{student.parent_phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-tight">{student.vans?.plate_number || "No Van"}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-37.5">{student.vans?.route_name || "Unassigned"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-300 hover:text-slate-600 p-2 rounded-lg transition-all"><MoreVertical size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? <MobileSkeleton /> : filteredStudents.map((student: any) => (
            <div key={student.id} className="p-4 flex flex-col gap-4 active:bg-slate-50">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    {student.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">{student.name}</h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-0.5">
                       <GraduationCap size={12} /> {student.class || "N/A"}
                    </div>
                  </div>
                </div>
                <StatusBadge status={student.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-3">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Parent</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{student.parent_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Route</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{student.vans?.route_name || "—"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <a href={`tel:${student.parent_phone}`} className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                  <Phone size={14} /> Call Parent
                </a>
                <button className="p-2 text-slate-400 border border-slate-200 rounded-lg bg-white shadow-sm">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper Components for Cleanliness
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    picked_up: "bg-emerald-50 text-emerald-600 border-emerald-100",
    waiting: "bg-amber-50 text-amber-600 border-amber-100",
    dropped_off: "bg-blue-50 text-blue-600 border-blue-100",
    default: "bg-slate-50 text-slate-400 border-slate-100"
  };
  const key = (status || "waiting") as keyof typeof styles;
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles[key] || styles.default}`}>
      {status?.replace("_", " ") || "Waiting"}
    </span>
  );
};

const TableSkeleton = () => [...Array(5)].map((_, i) => (
  <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-6"><div className="h-10 bg-slate-50 rounded-xl" /></td></tr>
));

const MobileSkeleton = () => [...Array(3)].map((_, i) => (
  <div key={i} className="p-4 animate-pulse"><div className="h-32 bg-slate-50 rounded-2xl" /></div>
));

export default StudentsPage;