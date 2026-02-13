import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, MoreVertical, School, Trash2, X, Mail, Truck } from "lucide-react";

const SchoolsPage = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newSchool, setNewSchool] = useState({ name: "", admin_email: "", pin: "" });

  const API_BASE = "https://safe-track-8a62.onrender.com/api/admin";

  useEffect(() => {
    fetchSchools();
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_BASE}/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching schools", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
    try {
      const token = localStorage.getItem("authToken");
      await axios.patch(`${API_BASE}/schools/${id}/approve`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(schools.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      setActiveMenu(null);
    } catch (err) {
      alert("Failed to update school status.");
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.post(`${API_BASE}/schools`, newSchool, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools([...schools, res.data.data]);
      setIsModalOpen(false);
      setNewSchool({ name: "", admin_email: "", pin: "" });
    } catch (err) {
      alert("Failed to add school.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.patch(`${API_BASE}/schools/${editingSchool.id}`, editingSchool, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(schools.map((s) => (s.id === editingSchool.id ? res.data.data : s)));
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update school.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete ${name}?`)) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_BASE}/schools/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(schools.filter((s) => s.id !== id));
    } catch (err) {
      alert("Error deleting school.");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">Manage Schools</h1>
          <p className="text-slate-500 text-sm font-medium">Educational institutions in your network.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> <span className="text-sm">Add New School</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl animate-pulse border border-slate-200" />
          ))
        ) : (
          schools.map((school) => (
            <div key={school.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <School size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 leading-tight">{school.name}</h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                      <Mail size={12} />
                      <span>{school.admin_email}</span>
                    </div>
                  </div>
                </div>
                
                {/* Responsive Actions */}
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === school.id ? null : school.id); }}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeMenu === school.id && (
                    <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 animate-in slide-in-from-top-2 duration-150">
                      <button onClick={() => { setEditingSchool(school); setIsEditModalOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit School</button>
                      <button onClick={() => handleToggleStatus(school.id, school.status)} className={`w-full text-left px-4 py-2 text-sm font-bold ${school.status === "Active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                        {school.status === "Active" ? "Suspend Account" : "Activate Account"}
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button onClick={() => handleDelete(school.id, school.name)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"><Trash2 size={14} /> Delete</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-md mt-0.5 inline-block ${school.status === "Active" ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {school.status || "Active"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fleet</span>
                    <span className="text-slate-700 text-xs font-black flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" /> {school.total_vans || 0} Vans
                    </span>
                  </div>
                </div>
                
                <button className="text-[11px] font-bold text-blue-600 hover:underline">View Details →</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Shared Modal UI (Simplified logic) */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">{isModalOpen ? "New School" : "Edit School"}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={isModalOpen ? handleAddSchool : handleUpdateSchool} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">School Name</label>
                <input 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                  value={isModalOpen ? newSchool.name : editingSchool.name}
                  onChange={(e) => isModalOpen ? setNewSchool({...newSchool, name: e.target.value}) : setEditingSchool({...editingSchool, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Admin Email</label>
                <input 
                  required type="email"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                  value={isModalOpen ? newSchool.admin_email : editingSchool.admin_email}
                  onChange={(e) => isModalOpen ? setNewSchool({...newSchool, admin_email: e.target.value}) : setEditingSchool({...editingSchool, admin_email: e.target.value})}
                />
              </div>
              {isModalOpen && (
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">System PIN</label>
                  <input 
                    required maxLength={6} type="password"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                    onChange={(e) => setNewSchool({...newSchool, pin: e.target.value})}
                  />
                </div>
              )}
              
              <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 mt-4 active:scale-[0.98] transition-transform">
                {isSubmitting ? "Processing..." : (isModalOpen ? "Create School" : "Update Details")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolsPage;