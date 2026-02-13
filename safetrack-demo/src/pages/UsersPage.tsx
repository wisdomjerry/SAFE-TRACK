import { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  Search,
  User,
  Mail,
  School,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Phone,
} from "lucide-react";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const API_BASE = "https://safe-track-8a62.onrender.com/api/admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, role: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_BASE}/users/${role}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      alert("Failed to delete user. They may have active records linked to them.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = (user.full_name || "").toLowerCase();
    const id = (user.identifier || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search) || id.includes(search);
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-medium">Loading user directory...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-slate-500 text-sm">Manage all platform roles across various institutions.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 outline-none shadow-sm cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="SCHOOL_ADMIN">Admins</option>
            <option value="DRIVER">Drivers</option>
            <option value="PARENT">Parents</option>
          </select>
        </div>
      </div>

      {/* --- RESPONSIVE CONTENT START --- */}
      
      {/* 1. Mobile & Tablet Card View (Visible on small screens, hidden on large) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{user.full_name}</p>
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                       {user.identifier?.includes("@") ? <Mail size={12} /> : <Phone size={12} />}
                       {user.identifier}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteUser(user.id, user.role, user.full_name)}
                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-50">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getRoleStyles(user.role)}`}>
                  <ShieldCheck size={12} />
                  {user.role?.replace("_", " ")}
                </span>
                <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                  <School size={14} />
                  {user.school_name || "No School"}
                </div>
              </div>
            </div>
          ))
        ) : (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                <p>No users found</p>
            </div>
        )}
      </div>

      {/* 2. Desktop Table View (Hidden on small screens, shown on Large) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identify</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">School Branch</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <User size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{user.full_name}</span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          {user.identifier?.includes("@") ? <Mail size={12} className="text-slate-300" /> : <Phone size={12} className="text-slate-300" />}
                          {user.identifier}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getRoleStyles(user.role)}`}>
                      <ShieldCheck size={12} />
                      {user.role?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <School size={16} className="text-slate-300" />
                      {user.school_name || <span className="text-slate-300 italic">No School Linked</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.role, user.full_name)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* --- RESPONSIVE CONTENT END --- */}
    </div>
  );
};

const getRoleStyles = (role: string) => {
  switch (role) {
    case "SCHOOL_ADMIN": return "bg-purple-100 text-purple-700 border border-purple-200";
    case "DRIVER": return "bg-amber-100 text-amber-700 border border-amber-200";
    case "PARENT": return "bg-blue-100 text-blue-700 border border-blue-200";
    case "SUPER_ADMIN": return "bg-slate-900 text-white";
    default: return "bg-slate-100 text-slate-600";
  }
};

export default UsersPage;