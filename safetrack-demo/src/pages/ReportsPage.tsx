import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Download,
  TrendingUp,
  Users,
  School as SchoolIcon,
} from "lucide-react";
import api from "../api/axios";

interface ReportData {
  name: string;
  schools: number;
  students: number;
}

const ReportsPage = () => {
  const [data, setData] = useState<ReportData[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSchools: 0,
    activeVans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/stats");

        if (res.data.success) {
          const apiData = res.data.data;
          setStats({
            totalStudents: apiData.stats?.totalStudents || 0,
            totalSchools: apiData.stats?.totalSchools || 0,
            activeVans: apiData.stats?.activeVans || 0,
          });

          if (apiData.chartData) {
            setData(apiData.chartData);
          } else {
            setData([
              { name: "Mon", schools: 0, students: 0 },
              { name: "Tue", schools: 0, students: 0 },
              { name: "Wed", schools: 0, students: 0 },
              { name: "Thu", schools: 0, students: 0 },
              { name: "Fri", schools: 0, students: 0 },
            ]);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium text-sm">
            Crunching numbers for you...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-sm">
            Track performance and engagement metrics.
          </p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all shadow-sm">
          <Download size={18} /> Export Data
        </button>
      </div>

      {/* Stats Grid: 1 column on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Total Schools"
          value={stats.totalSchools.toLocaleString()}
          change="+1"
          icon={<SchoolIcon size={20} className="text-blue-500" />}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          change="+18%"
          icon={<Users size={20} className="text-purple-500" />}
        />
        <StatCard
          title="Active Vans"
          value={stats.activeVans.toLocaleString()}
          change="+5%"
          icon={<TrendingUp size={20} className="text-green-500" />}
        />
      </div>

      {/* Charts Grid: 1 column on tablet, 2 on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Onboarding Trend */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Activity Trend
          </h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11 }} 
                  dy={10} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="schools"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Volume */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Student Volume
          </h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11 }} 
                  dy={10} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "12px", border: "none", fontSize: '12px' }}
                />
                <Bar
                  dataKey="students"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  barSize={window.innerWidth < 640 ? 20 : 40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon }: any) => (
  <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">{icon}</div>
      <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-wider">
        {change}
      </span>
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">{title}</p>
    <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
  </div>
);

export default ReportsPage;