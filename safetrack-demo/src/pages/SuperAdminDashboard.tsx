// src/pages/SuperAdminDashboard.tsx
import { useEffect, useState } from "react";
import authService from "../services/authServices";
import StatCard from "../components/StatCard";
import { supabase } from "../config/supabaseClient";
import axios from "../api/axios";

interface School {
  admin_email: string;
  id: string;
  name: string;
  admin_name: string;
  student_count: number;
  status: "Active" | "Pending" | "Inactive";
  created_at: string;
}

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chartData, setChartData] = useState<
    { name: string; schools: number; students: number }[]
  >([]);

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 1. Fetch Master Data on Load
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const response = await authService.getDashboardData("SUPER_ADMIN");
        console.log("Full API Response:", response); // Look at your browser console (F12)

        // Look at your console log: the data is inside response.data.data
        // We use the same logic that makes your Schools Page work
        const actualData = response.data?.data || response.data;

        if (actualData) {
          // Set the stats (totalStudents, etc)
          setStats(actualData.stats || null);

          // Set the schools array
          // We ensure it's an array so .map() doesn't crash
          setSchools(actualData.schools || []);
          setChartData(actualData.chartData || []);
        }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Reset failed", err);
      alert("Failed to reset system: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleApprove = async (schoolId: string) => {
    try {
      const token = localStorage.getItem("authToken"); // Get your token

      await axios.patch(
        `https://safe-track-8a62.onrender.com/api/admin/schools/${schoolId}/approve`,
        {}, // Empty body if the endpoint doesn't require one
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token in headers
          },
        },
      );

      // Optimistic Update: Update UI immediately
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, status: "Active" } : s)),
      );

      console.log(`School ${schoolId} approved successfully`);
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Error approving school. Check console for details.");
    }
  };

  {
    /* 1. First, calculate the max value for scaling at the top of your component */
  }
  const maxStudents = Math.max(...chartData.map((d) => d.students), 10) || 10;

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
      {/* 2. Replace your grid section with this */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Enrollment Growth - LIVE BAR CHART */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-[#1d1c1d]">
            Student Enrollment Growth
          </h3>
          <div className="h-64 w-full bg-gray-50 rounded-lg flex items-end justify-around p-4 gap-2">
            {chartData.map((data, i) => (
              <div
                key={i}
                className="group relative flex-1 bg-blue-500/80 rounded-t-sm hover:bg-blue-600 transition-all cursor-help"
                style={{ height: `${(data.students / maxStudents) * 100}%` }}
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                  {data.students} Students
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {chartData.map((data, i) => (
              <span key={i}>{data.name}</span>
            ))}
          </div>
        </div>

        {/* System Activity - LIVE LINE CHART SKELETON */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-[#1d1c1d]">
            School Registration Activity
          </h3>
          <div className="h-64 w-full border-b border-l border-gray-100 relative overflow-hidden bg-slate-50/30">
            <svg
              className="absolute bottom-0 left-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Dynamic Path based on School counts per month */}
              <path
                d={`M 0,100 ${chartData
                  .map(
                    (d, i) =>
                      `L ${(i / (chartData.length - 1)) * 100},${100 - d.schools * 20}`,
                  )
                  .join(" ")} L 100,100 Z`}
                fill="url(#gradient)"
                className="opacity-20"
              />
              <path
                d={`M 0,100 ${chartData
                  .map(
                    (d, i) =>
                      `L ${(i / (chartData.length - 1)) * 100},${100 - d.schools * 20}`,
                  )
                  .join(" ")}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <span>Early {chartData[0]?.name}</span>
            <span>Latest ({chartData[chartData.length - 1]?.name})</span>
          </div>
        </div>
      </div>

      {/* Dynamic School Management Table */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-20">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            School Management
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Desktop Table View (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">
                <th className="px-6 py-4">School Details</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredSchools.map((school) => (
                <tr
                  key={school.id}
                  className="hover:bg-slate-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {school.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {school.admin_email || "No email"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-semibold">
                    {school.student_count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        school.status === "Active"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {school.status !== "Active" && (
                        <button
                          onClick={() => handleApprove(school.id)}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (Visible only on Mobile) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredSchools.map((school) => (
            <div
              key={school.id}
              className="p-5 active:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <h4 className="font-bold text-slate-900 text-base">
                    {school.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {school.admin_email}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                    school.status === "Active"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {school.status}
                </span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                    Total Students
                  </span>
                  <span className="text-sm font-black text-slate-700">
                    {school.student_count || 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  {school.status !== "Active" && (
                    <button
                      onClick={() => handleApprove(school.id)}
                      className="bg-emerald-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg"
                    >
                      Approve
                    </button>
                  )}
                  <button className="border border-slate-200 text-slate-600 text-[10px] font-bold px-4 py-2 rounded-lg">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSchools.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-slate-300 font-medium text-sm">
              No schools matching your search.
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
