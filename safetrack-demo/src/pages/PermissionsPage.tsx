import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, Save, Loader2 } from "lucide-react";

interface Role {
  id: string;
  role: string;
  permissions: string[];
}

const PermissionsPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeMobileRole, setActiveMobileRole] = useState<string | null>(null);

  const features = [
    "View Dashboard",
    "Edit Schools",
    "Delete Users",
    "Access Reports",
    "Track Vans",
  ];

  const API_BASE = "https://safe-track-8a62.onrender.com/api/admin/permissions";

  useEffect(() => {
    fetchPerms();
  }, []);

  // Auto-set first role for mobile view
  useEffect(() => {
    if (roles.length > 0 && !activeMobileRole) {
      setActiveMobileRole(roles[0].id);
    }
  }, [activeMobileRole, roles]);

  const fetchPerms = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeData = res.data.data.map((r: any) => ({
        ...r,
        permissions: r.permissions || [],
      }));
      setRoles(safeData);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const togglePermission = (roleId: string, feature: string) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === roleId) {
          const currentPerms = role.permissions || [];
          const newPerms = currentPerms.includes(feature)
            ? currentPerms.filter((p) => p !== feature)
            : [...currentPerms, feature];
          return { ...role, permissions: newPerms };
        }
        return role;
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        API_BASE,
        { roles },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Permissions updated successfully!");
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={28} />
            Access Control
          </h1>
          <p className="text-slate-500 text-sm">
            Define global access levels for system roles.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Mobile Role Selector (Only visible on small screens) */}
      <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveMobileRole(role.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeMobileRole === role.id
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {role.role.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Desktop View (Table) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-8 py-5 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-100">
                  Feature / Permission
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-6 py-5 font-black text-slate-400 text-center uppercase text-[10px] tracking-[0.2em]"
                  >
                    {role.role.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {features.map((feature) => (
                <tr
                  key={feature}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-5 font-bold text-slate-700 text-sm sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                    {feature}
                  </td>
                  {roles.map((role) => (
                    <td key={role.id} className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                          checked={(role.permissions || []).includes(feature)}
                          onChange={() => togglePermission(role.id, feature)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View (List) */}
        <div className="lg:hidden">
          {features.map((feature) => {
            const activeRoleObj = roles.find((r) => r.id === activeMobileRole);
            const isChecked = activeRoleObj?.permissions.includes(feature);

            return (
              <div
                key={feature}
                className="flex items-center justify-between p-5 border-b border-slate-100 last:border-0"
                onClick={() =>
                  activeMobileRole &&
                  togglePermission(activeMobileRole, feature)
                }
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">
                    {feature}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                    Access for {activeRoleObj?.role.replace("_", " ")}
                  </span>
                </div>
                <div
                  className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${isChecked ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isChecked ? "translate-x-6" : "translate-x-0"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;
