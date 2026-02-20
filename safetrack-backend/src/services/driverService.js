const { supabase } = require("../config/supabaseClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// LOGIN DRIVER
async function driverLoginService(phone_number, pin) {
  const { data, error } = await supabase
    .from("drivers")
    .select(`id, full_name, phone_number, pin, school_id, assigned_van_id`)
    .eq("phone_number", phone_number)
    .single();

  if (error || !data) throw new Error("Invalid phone number or PIN");

  const isValid = await bcrypt.compare(pin, data.pin);
  if (!isValid) throw new Error("Invalid phone number or PIN");

  const token = jwt.sign(
    {
      id: data.id,
      full_name: data.full_name,
      role: "DRIVER",
      school_id: data.school_id,
      assigned_van_id: data.assigned_van_id,
    },
    JWT_SECRET,
    { expiresIn: "8h" },
  );

  delete data.pin;
  return { driver: data, token };
}

// CREATE DRIVER
async function createDriverService(driver) {
  const hashedPin = await bcrypt.hash(driver.pin, SALT_ROUNDS);
  const { data, error } = await supabase
    .from("drivers")
    .insert([
      {
        full_name: driver.full_name,
        phone_number: driver.phone_number,
        license_number: driver.license_number,
        pin: hashedPin,
        school_id: driver.school_id,
        assigned_van_id: driver.assigned_van_id || null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// --- GET DRIVER DASHBOARD ---
async function getDriverDashboardService(driver_id, school_id) {
  const { data: van, error: vanError } = await supabase
    .from("vans")
    .select("*")
    .eq("driver_id", driver_id)
    .maybeSingle();

  if (vanError) throw new Error("Error fetching van: " + vanError.message);

  if (!van) {
    return {
      van: { model: "No Van Assigned", plate_number: "N/A" },
      students: [],
    };
  }

  // FIXED: Included handover_token and photo_url
  const { data: students, error: studentError } = await supabase
    .from("students")
    .select("id, name, home_address, is_on_bus, status, parent_phone, handover_token")
    .eq("assigned_van_id", van.id);

  if (studentError) throw new Error("Error fetching students: " + studentError.message);

  return { van, students: students || [] };
}

// --- GET DRIVER ROUTE ---
async function getDriverRouteService(driver_id) {
  const { data: driverData } = await supabase
    .from("drivers")
    .select("assigned_van_id")
    .eq("id", driver_id)
    .single();

  if (!driverData?.assigned_van_id) return [];

  // FIXED: Included handover_token and photo_url here too
  const { data: students, error } = await supabase
    .from("students")
    .select("id, name, parent_phone, is_on_bus, home_address, status, handover_token")
    .eq("assigned_van_id", driverData.assigned_van_id);

  if (error) throw new Error(error.message);
  return students;
}

// --- FINISH ROUTE (The Reset Logic) ---
async function finishRouteService(van_id, school_id) {
  if (!van_id) throw new Error("No van ID provided to finish route");

  // 1. Reset Van Stats
  const { error: vanError } = await supabase
    .from("vans")
    .update({
      current_lat: null,
      current_lng: null,
      current_speed: 0,
      status: "parked",
      current_location_name: "Shift Ended",
    })
    .eq("id", van_id);

  if (vanError) throw new Error(vanError.message);

  // 2. Reset Students for the NEXT shift
  // We set status to 'waiting' so they appear ready for the driver tomorrow
  const { error: studentError } = await supabase
    .from("students")
    .update({ 
      is_on_bus: false, 
      status: "waiting" 
    })
    .eq("assigned_van_id", van_id);

  if (studentError) throw new Error(studentError.message);

  // 3. Clear History (Optional)
  // You might want to clear van_location_history here or keep it for the parent's records
  
  return { success: true };
}

// UPDATE STUDENT STATUS (PICKUP/DROPOFF)
const updateStudentStatusService = async (studentId, isOnBus) => {
  const newStatus = isOnBus ? "picked_up" : "dropped_off";
  const { data, error } = await supabase
    .from("students")
    .update({ is_on_bus: isOnBus, status: newStatus })
    .eq("id", studentId)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

module.exports = {
  driverLoginService,
  createDriverService,
  getDriverDashboardService,
  getDriverRouteService,
  finishRouteService,
  updateStudentStatusService,
};
