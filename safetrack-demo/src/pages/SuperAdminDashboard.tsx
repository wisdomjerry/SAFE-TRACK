// src/pages/SuperAdminDashboard.tsx
import { useEffect, useState } from "react";
import authService from "../services/authServices";
import StatCard from "../components/StatCard";
import { supabase } from "../config/supabaseClient";
import axios from "../api/axios";

interface School {
  id: string;
  name: string;
  admin_name: string;
  student_count: number;
  status: "Active" | "Pending" | "Inactive";
  created_at: string;
}

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // 1. Fetch Master Data on Load
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const response = await authService.getDashboardData("SUPER_ADMIN");
        // Assuming backend returns: { stats: { totalStudents: X, ... }, schools: [...] }
        setStats(response.data.stats);
        setSchools(response.data.schools);
      } catch (err) {
        console.error("Failed to fetch Super Admin data", err);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  

  // 3. Handle Manual System Reset
  const handleSystemReset = async () => {
    const confirmReset = window.confirm(
      "⚠️ WARNING: This will reset ALL students to 'waiting' and generate NEW guardian PINs immediately. This cannot be undone. Proceed?",
    );

    if (!confirmReset) return;

    setIsResetting(true);
    try {
      // Calls the Postgres function we created via the SQL Editor
      const { error } = await supabase.rpc("reset_all_students_midnight");

      if (error) throw error;

      alert(
        "🚀 System Reset Successful! All students are now in 'waiting' status.",
      );
      // Optionally refresh stats to show changes
      window.location.reload();
    } catch (err: any) {
      console.error("Reset failed", err);
      alert("Failed to reset system: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // 2. Handle School Status Updates (e.g., Approving a new school)
  const handleApprove = async (schoolId: string) => {
    try {
      // You would add this endpoint to your authService/axios logic
       await axios.patch(`https://safe-track-8a62.onrender.com/api/admin/schools/${schoolId}/approve`);

      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, status: "Active" } : s)),
      );
    } catch (err) {
      alert("Error approving school");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center font-bold text-gray-400 animate-pulse">
        Fetching System-wide Records...
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1c1d]">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            System overview and school management
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4">
          <button
            onClick={handleSystemReset}
            disabled={isResetting}
            className={`${
              isResetting ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"
            } text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2`}
          >
            {isResetting ? "Resetting..." : "🔄 Force Midnight Reset"}
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            System Reports
          </button>
        </div>
      </header>

      {/* Dynamic Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents?.toLocaleString() || "0"}
          color="text-blue-600"
          trend="↗ Active in system"
        />
        <StatCard
          title="Total Schools"
          value={stats?.totalSchools || "0"}
          color="text-purple-600"
          trend="Registered Institutions"
        />
        <StatCard
          title="Active Vans"
          value={stats?.activeVans || "0"}
          color="text-green-600"
          trend="Live tracking active"
        />
        <StatCard
          title="Pending Approvals"
          value={schools.filter((s) => s.status === "Pending").length}
          color="text-orange-500"
          trend="Awaiting review"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-[#1d1c1d]">
            Student Enrollment Growth
          </h3>
          <div className="h-64 w-full bg-gray-50 rounded-lg flex items-end justify-around p-4 gap-2">
            {/* Visual representation of growth data */}
            {[40, 60, 55, 70, 85, 90, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500/80 rounded-t-sm hover:bg-blue-600 transition-all cursor-help"
                style={{ height: `${h}%` }}
                title={`Month ${i + 1}: ${h}%`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-[#1d1c1d]">
            System Activity
          </h3>
          <div className="h-64 w-full border-b border-l border-gray-100 relative overflow-hidden bg-slate-50/30">
            <svg
              className="absolute bottom-0 left-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M0,80 Q25,90 40,20 T100,60"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              <circle cx="40" cy="20" r="3" fill="#3b82f6" />
            </svg>
          </div>
          <div className="flex justify-between mt-4 px-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* Dynamic School Management Table */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#1d1c1d]">
            School Management
          </h3>
          <input
            type="text"
            placeholder="Search schools..."
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8f9fa] text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">School Name</th>
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {schools.map((school) => (
                <tr
                  key={school.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {school.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {school.admin_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {school.student_count?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        school.status === "Active"
                          ? "bg-green-100 text-green-600"
                          : school.status === "Pending"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      {school.status === "Pending" && (
                        <button
                          onClick={() => handleApprove(school.id)}
                          className="text-green-600 hover:text-green-800 font-bold text-xs uppercase"
                        >
                          Approve
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schools.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No school records found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
