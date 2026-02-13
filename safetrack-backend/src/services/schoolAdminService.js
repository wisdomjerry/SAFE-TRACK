const { supabase } = require("../config/supabaseClient");

// Combined Dashboard Stats Service
async function getSchoolDashboardStatsService(school_id) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  monday.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    students,
    vans,
    drivers,
    recentLogs,
    weeklyAttendance,
    liveTrips,
    driversData,
    todayAttendance,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", school_id),
    supabase
      .from("vans")
      .select("*", { count: "exact", head: true })
      .eq("school_id", school_id)
      .eq("status", "active"),
    supabase
      .from("drivers")
      .select("*", { count: "exact", head: true })
      .eq("school_id", school_id),
    supabase
      .from("pickup_logs")
      .select(
        `id, status, created_at, students (full_name), vans (plate_number)`,
      )
      .eq("school_id", school_id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("pickup_logs")
      .select("created_at")
      .eq("school_id", school_id)
      .gte("created_at", monday.toISOString())
      .eq("status", "picked_up"),
    supabase
      .from("trips")
      .select(`id, status, type, drivers (full_name), vans (plate_number)`)
      .eq("school_id", school_id)
      .in("status", ["on_route", "delayed"])
      .limit(3),
    supabase
      .from("drivers")
      .select("id, full_name, total_trips, rating")
      .eq("school_id", school_id)
      .order("rating", { ascending: false })
      .limit(3),
    supabase
      .from("pickup_logs")
      .select("student_id")
      .eq("school_id", school_id)
      .eq("status", "picked_up")
      .gte("created_at", todayStart.toISOString()),
  ]);

  const chartCounts = [0, 0, 0, 0, 0];
  weeklyAttendance.data?.forEach((log) => {
    const day = new Date(log.created_at).getDay();
    if (day >= 1 && day <= 5) chartCounts[day - 1]++;
  });

  const totalStudentsCount = students.count || 0;
  const uniqueStudentsToday = new Set(
    todayAttendance.data?.map((l) => l.student_id),
  ).size;
  const rate =
    totalStudentsCount > 0
      ? Math.round((uniqueStudentsToday / totalStudentsCount) * 100)
      : 0;

  return {
    stats: {
      totalStudents: totalStudentsCount,
      activeVans: vans.count || 0,
      totalDrivers: drivers.count || 0,
      attendanceRate: `${rate}%`,
    },
    chart: chartCounts,
    liveRoutes: liveTrips.data || [],
    recentActivity: recentLogs.data || [],
    topDrivers: driversData.data || [],
  };
}

// Student Detail Service (Used for the Students Page)
// src/services/schoolAdminService.js

async function getStudentsFullDetailService(school_id) {
  console.log("🛠 Querying Supabase for students...");
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      name,
      class,
      parent_name,
      parent_phone,
      status,
      vans!assigned_van_id (
        plate_number,
        route_name,
        driver_name,    
        driver_phone
      )
    `,
    )
    .eq("school_id", school_id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase Error Details:", error);
    throw new Error(error.message);
  }
  return data;
}

async function getVansWithRouteDetails(school_id) {
  const { data, error } = await supabase
    .from("vans")
    .select(
      `
      id,
      plate_number,
      model,
      status,
      capacity,
      driver_name,
      students!assigned_van_id ( id ) 
    `,
    )
    .eq("school_id", school_id);

  if (error) throw new Error(error.message);

  return data.map((van) => ({
    ...van,
    studentCount: van.students?.length || 0,
    drivers: { full_name: van.driver_name }, // Formatting to match your UI
  }));
}

async function getDriversWithDetails(school_id) {
  // 1. Fetch all drivers for this school
  const { data: drivers, error: driverError } = await supabase
    .from("drivers")
    .select("*")
    .eq("school_id", school_id)
    .order("full_name", { ascending: true });

  if (driverError) throw new Error(driverError.message);
  if (!drivers || drivers.length === 0) return [];

  // 2. Fetch all vans for this school to map them
  const { data: vans, error: vanError } = await supabase
    .from("vans")
    .select("id, plate_number")
    .eq("school_id", school_id);

  if (vanError) console.error("Non-critical: Could not fetch vans for mapping");

  // 3. Manually merge the van data into the driver objects
  const mergedData = drivers.map((driver) => {
    const assignedVan = vans?.find((v) => v.id === driver.van_id);
    return {
      ...driver,
      vans: assignedVan ? { plate_number: assignedVan.plate_number } : null,
    };
  });

  return mergedData;
}

async function createSchoolAdminService(adminData) {
  // If you are using a separate table for admins, insert here.
  // If you just want this to return the data, you can do that too.
  const { data, error } = await supabase
    .from("schools") // Ensure this table exists if you use it
    .insert([adminData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Helper Services for simple fetches
async function getStudentsBySchoolService(school_id) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", school_id);
  if (error) throw new Error(error.message);
  return data;
}

async function getVansBySchoolService(school_id) {
  const { data, error } = await supabase
    .from("vans")
    .select("*")
    .eq("school_id", school_id);
  if (error) throw new Error(error.message);
  return data;
}

async function getTripsBySchoolService(school_id) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("school_id", school_id);
  if (error) throw new Error(error.message);
  return data;
}

const getAdminStatsService = async (schoolId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  try {
    const [pickups, onboard, alerts, fleetStudents, fleetVans, fleetDrivers] = await Promise.all([
      // 1. Live Stats (Pickup Logs)
      supabase
        .from("pickup_logs")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("action_type", "pickup")
        .gte("scanned_at", todayISO),

      // 2. Currently on Bus
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("status", "picked_up"),

      // 3. Alerts
      supabase
        .from("pickup_logs")
        .select("id")
        .eq("school_id", schoolId)
        .eq("action_type", "dropoff")
        .gte("scanned_at", todayISO),

      // 4. Fleet Totals (The missing data for the wizard logic)
      supabase.from("students").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("vans").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("drivers").select("*", { count: "exact", head: true }).eq("school_id", schoolId)
    ]);

    // This is the structure your Frontend AdminDashboard expects:
    return {
      stats: {
        totalStudents: fleetStudents.count || 0,
        activeVans: fleetVans.count || 0,
        totalDrivers: fleetDrivers.count || 0,
        attendanceRate: fleetStudents.count > 0 
          ? Math.round(((onboard.count || 0) / fleetStudents.count) * 100) + "%" 
          : "0%"
      },
      totalPickups: pickups.count || 0,
      currentlyOnBoard: onboard.count || 0,
      alertsCount: alerts.data?.length || 0,
      needsOnboarding: (fleetStudents.count === 0 && fleetVans.count === 0), // Automatic logic
      timestamp: new Date().toLocaleTimeString("en-GB", {
        timeZone: "Africa/Kampala",
      }),
    };
  } catch (err) {
    console.error("💥 Critical Stats Failure:", err.message);
    return { 
      stats: { totalStudents: 0, activeVans: 0, totalDrivers: 0, attendanceRate: "0%" },
      totalPickups: 0, 
      currentlyOnBoard: 0, 
      alertsCount: 0, 
      needsOnboarding: true,
      timestamp: "--:--" 
    };
  }
};

module.exports = {
  getSchoolDashboardStatsService,
  getStudentsFullDetailService,
  getStudentsBySchoolService,
  getVansBySchoolService,
  getTripsBySchoolService,
  getVansWithRouteDetails,
  getDriversWithDetails,
  getAdminStatsService,
  createSchoolAdminService,
};
