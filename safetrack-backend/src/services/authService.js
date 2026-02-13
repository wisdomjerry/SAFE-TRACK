const { supabase } = require("../config/supabaseClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * Normalizes phone numbers to match database format (256...)
 */
const normalizePhone = (phone) => {
  let cleaned = phone.replace(/\D/g, ''); // Remove non-numbers
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return '256' + cleaned;
  }
  return cleaned;
};

// 1. DRIVER LOGIN
async function driverLoginService(phone, pin) {
  const cleanPhone = normalizePhone(phone);
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*, vans(id, plate_number, model)')
    .eq('phone_number', cleanPhone)
    .single();

  if (error || !driver) throw new Error("Driver account not found");

  const isValid = await bcrypt.compare(pin, driver.pin);
  if (!isValid) throw new Error("Invalid Phone or PIN");

  const token = jwt.sign(
    { id: driver.id, role: "DRIVER", school_id: driver.school_id, assigned_van_id: driver.assigned_van_id },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  delete driver.pin;
  return { driver, token };
}

// 2. PARENT LOGIN (The missing piece!)
async function parentLoginService(phone, pin) {
  const cleanPhone = normalizePhone(phone);
  
  console.log(`🔍 SERVICE: Searching for parent with: ${cleanPhone}`);

  const { data: parent, error } = await supabase
    .from('parents')
    .select('*')
    .eq('phone_number', cleanPhone)
    .maybeSingle(); // maybeSingle prevents throwing error on 0 results

  if (error || !parent) {
    console.error("❌ DB Error or No Parent:", error?.message);
    throw new Error("Parent account not found");
  }

  // Verify Bcrypt Hash
  const isValid = await bcrypt.compare(pin, parent.pin);
  if (!isValid) throw new Error("Invalid Phone or PIN");

  const token = jwt.sign(
    { 
      id: parent.id, 
      role: "PARENT", 
      school_id: parent.school_id,
      name: parent.full_name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  delete parent.pin;
  return { parent, token };
}

// 3. ADMIN LOGIN
async function adminLoginService(email, pin) {
  const { data: school, error } = await supabase
    .from("schools")
    .select("*")
    .eq("admin_email", email.trim().toLowerCase())
    .single();

  if (error || !school) throw new Error("School workspace not found");

  const isValid = await bcrypt.compare(pin, school.pin); 
  if (!isValid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: school.id, role: "SCHOOL_ADMIN", school_id: school.id, name: school.school_name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  delete school.pin;
  return { school, token };
}

module.exports = {
  driverLoginService,
  parentLoginService, // Make sure this is exported!
  adminLoginService
};