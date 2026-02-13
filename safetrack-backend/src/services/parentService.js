const { supabase } = require("../config/supabaseClient");

// Get parent by phone number (for login)
async function parentLoginService(phone_number) {
  const { data, error } = await supabase
    .from("parents")
    .select("*")
    .eq("phone_number", phone_number)
    .single();

  if (error) return null;
  return data;
}

// Create a new parent
async function createParentService(parent) {
  const { data, error } = await supabase
    .from("parents")
    .insert([parent])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Get all children of a parent (filtered by school_id)
async function getChildrenByParentService(parent_id, school_id) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("parent_id", parent_id)
    .eq("school_id", school_id);

  if (error) throw new Error(error.message);
  return data;
}

async function getParentChildrenService(parent_id) {
  try {
    console.log("🚀 [Service] Fetching children for Parent:", parent_id);

    // 1. Get students
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("parent_id", parent_id);

    if (studentError) throw studentError;
    if (!students || students.length === 0) return [];

    // 2. Get ONLY necessary data to avoid 500 errors on large tables
    const [{ data: schools }, { data: vans }] = await Promise.all([
      supabase.from("schools").select("id, name"),
      supabase
        .from("vans")
        .select(
          "id, plate_number, driver_name, driver_phone, current_lat, current_lng, current_speed, status",
        ),
    ]);

    return students.map((student) => {
      const van = vans?.find((v) => v.id === student.assigned_van_id);
      const school = schools?.find((s) => s.id === student.school_id);

      return {
        ...student,
        full_name: student.name,
        school_name: school?.name || "Unknown School",
        van_id: van?.id || null,
        lat: van?.current_lat || 0,
        lng: van?.current_lng || 0,
        current_speed: van?.current_speed || 0,
        is_on_bus: van?.status === "on_route",
        driver_name: van?.driver_name || "Assigning...",
        driver_phone: van?.driver_phone || null,
      };
    });
  } catch (error) {
    console.error(
      "❌ [Service] Critical Error in getParentChildrenService:",
      error.message,
    );
    throw error; // This allows your controller to catch it and send a proper 500
  }
}

async function getChildAttendanceHistory(student_id) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", student_id)
    .order("timestamp", { ascending: false });

  if (error) throw new Error(error.message);

  // Optional: Group by date on the backend to make frontend's life easier
  return data;
}

async function updateStudentGuardianPin(student_id, parent_id, new_pin) {
  console.log(
    `Update Attempt - Student: ${student_id}, Parent: ${parent_id}, PIN: ${new_pin}`,
  );

  const { data, error, count } = await supabase
    .from("students")
    .update({ guardian_pin: String(new_pin) }) // Ensure it's a string
    .eq("id", student_id)
    .eq("parent_id", parent_id)
    .select();

  if (error) {
    console.error("❌ Database Error:", error.message);
    throw new Error(error.message);
  }

  // If data is empty, it means the ID or Parent_ID didn't match anything
  if (!data || data.length === 0) {
    console.error(
      "⚠️ Update failed: No student found matching this ID and Parent ID combination.",
    );
    throw new Error("Student not found or unauthorized.");
  }

  console.log("✅ Database Updated Successfully:", data[0].guardian_pin);
  return data;
}
module.exports = {
  parentLoginService,
  createParentService,
  getChildrenByParentService,
  getParentChildrenService,
  getChildAttendanceHistory,
  updateStudentGuardianPin,
};
