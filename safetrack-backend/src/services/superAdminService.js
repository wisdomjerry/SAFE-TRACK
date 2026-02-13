const { supabase } = require("../config/supabaseClient");

const superAdminService = {
  getDashboardStats: async () => {
    // 1. Concurrent Fetching
    const [studentsCount, schoolsCount, activeVansCount, allSchools] =
      await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("schools").select("*", { count: "exact", head: true }),
        supabase
          .from("vans")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        // FIX: Use 'school_name' if that is your column name.
        // Using 'students(count)' requires a defined Foreign Key in Supabase
        supabase
          .from("schools")
          .select("id, name, status, created_at, students(count)"),
      ]);

    // 2. Format Recent Schools
    const formattedSchools =
      allSchools.data
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map((school) => ({
          id: school.id,
          name: school.schoolname, // Map back to 'name' for the Frontend
          status: school.status,
          student_count: school.students?.[0]?.count || 0,
          created_at: school.created_at,
        })) || [];

    // 3. Generate Chart Data
    const chartData = superAdminService.generateChartData(
      allSchools.data || [],
    );

    return {
      stats: {
        totalStudents: studentsCount.count || 0,
        totalSchools: schoolsCount.count || 0,
        activeVans: activeVansCount.count || 0,
      },
      schools: formattedSchools,
      chartData: chartData,
    };
  },

  generateChartData: (schools) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();
    const report = months.map((m) => ({ name: m, schools: 0, students: 0 }));

    schools.forEach((school) => {
      const date = new Date(school.created_at);
      const monthIndex = date.getMonth();
      if (monthIndex >= 0 && monthIndex <= 11) {
        report[monthIndex].schools += 1;
        report[monthIndex].students += school.students?.[0]?.count || 0;
      }
    });

    return report.slice(0, currentMonth + 1);
  },

  fetchAllSchools: async () => {
    // 1. Fetch schools and vans separately
    const [schoolsResponse, vansResponse] = await Promise.all([
      supabase.from("schools").select("*").order("name"),
      supabase.from("vans").select("school_id"),
    ]);

    if (schoolsResponse.error) throw schoolsResponse.error;
    if (vansResponse.error) throw vansResponse.error;

    const schools = schoolsResponse.data || [];
    const vans = vansResponse.data || [];

    // 2. Manually map with a "strict" string comparison
    return schools.map((school) => {
      // We force both IDs to strings and trim them just in case
      const schoolVans = vans.filter(
        (v) =>
          String(v.school_id).toLowerCase().trim() ===
          String(school.id).toLowerCase().trim(),
      );

      return {
        ...school,
        // Match the frontend key name exactly
        total_vans: schoolVans.length,
        // Keep the nested structure just in case
        vans: [{ count: schoolVans.length }],
      };
    });
  },

  updateSchoolStatus: async (id, status) => {
    const { data, error } = await supabase
      .from("schools")
      .update({ status })
      .eq("id", id)
      .select(); // Always add .select() to get the updated data back

    if (error) throw error;
    return data;
  },

  deleteSchool: async (id) => {
    const { error } = await supabase.from("schools").delete().eq("id", id);

    if (error) throw error;
    return true;
  },
};

module.exports = superAdminService;
