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
        is_on_bus: student.is_on_bus,
        driver_name: van?.driver_name || "Assigning...",
        driver_phone: van?.driver_phone || null,
        // Safeguard: Ensure handover_token is present for the QR code
        handover_token: student.handover_token || student.id
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

async function logHandoverEvent({ studentId, driverId, action, method, lat, lng }) {
  try {
    const { error } = await supabase
      .from("pickup_logs")
      .insert({
        student_id: studentId,
        driver_id: driverId,
        action_type: action, // 'pickup' or 'dropoff'
        verification_hash: method,
        location_lat: lat,
        location_lng: lng
      });

    if (error) throw error;
    console.log(`✅ [Audit] ${action} logged for student ${studentId}`);
  } catch (error) {
    console.error("❌ [Audit Error] Failed to log event:", error.message);
    // We don't throw here so the main process doesn't fail if logging fails
  }
}

async function getChildAttendanceHistory(student_id) {
  const { data, error } = await supabase
    .from("pickup_logs") // 🟢 Change from "attendance" to "pickup_logs"
    .select("id, action_type, timestamp, van_id, location_name")
    .eq("student_id", student_id)
    .order("timestamp", { ascending: false });

  if (error) throw new Error(error.message);
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

async function updateHomeLocationService(student_id, lat, lng) {
  const { data, error } = await supabase
    .from("students")
    .update({ 
      home_lat: lat, 
      home_lng: lng 
    })
    .eq("id", student_id)
    .select();

  if (error) throw new Error(error.message);
  return data;
}


module.exports = {
  parentLoginService,
  createParentService,
  getChildrenByParentService,
  getParentChildrenService,
  getChildAttendanceHistory,
  updateStudentGuardianPin,
  logHandoverEvent,
  updateHomeLocationService,
};
