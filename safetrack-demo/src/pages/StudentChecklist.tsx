import { useEffect, useState } from "react";
import api from "../api/axios";
import { CheckCircle2, Circle, User, MapPin, Search } from "lucide-react";

const StudentChecklist = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/api/drivers/dashboard");
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Failed to load checklist", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle status (Optimistic UI update)
  const toggleAttendance = async (studentId: string, currentStatus: boolean) => {
    // 1. Update UI immediately for responsiveness
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, is_on_bus: !currentStatus } : s)
    );

    try {
      // 2. Sync with backend
      await api.post(`/api/drivers/mark-attendance`, { 
        studentId, 
        status: !currentStatus ? 'picked_up' : 'waiting' 
      });
    } catch (err) {
      // 3. Revert if API fails
      console.error("Failed to update attendance");
      fetchStudents(); 
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Driver Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Passenger List
            </h2>
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md">
              {students.filter(s => s.is_on_bus).length} / {students.length} ON BOARD
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search student name..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
           <div className="space-y-3 mt-4">
             {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-slate-100" />)}
           </div>
        ) : (
          <div className="space-y-3 mt-2">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => toggleAttendance(student.id, student.is_on_bus)}
                className={`w-full flex items-center justify-between p-4 rounded-4xl border transition-all active:scale-[0.98] ${
                  student.is_on_bus 
                    ? "bg-emerald-50 border-emerald-100 shadow-sm" 
                    : "bg-white border-slate-100 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    student.is_on_bus ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <User size={20} />
                  </div>
                  <div className="max-w-45 sm:max-w-xs">
                    <p className={`font-black text-sm ${student.is_on_bus ? "text-emerald-900" : "text-slate-800"}`}>
                      {student.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                      <MapPin size={10} />
                      <p className="text-[10px] font-bold uppercase truncate tracking-tighter">
                        {student.home_address || "Address not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  {student.is_on_bus ? (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="text-emerald-500" size={32} />
                      <span className="text-[8px] font-black text-emerald-600 uppercase">Boarded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Circle className="text-slate-200" size={32} />
                      <span className="text-[8px] font-black text-slate-300 uppercase">Waiting</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold">No students found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentChecklist;