const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { supabase } = require("../config/supabaseClient");
const {
  schoolAdminLoginService,
  createSchoolAdminService,
  getStudentsFullDetailService,
  getVansWithRouteDetails,
  getDriversWithDetails,
  getAdminStatsService,
} = require("../services/schoolAdminService");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// 1. REGISTER SCHOOL & ADMIN
async function registerSchool(req, res) {
  try {
    const {
      school_name,
      address,
      phone,
      school_email,
      admin_name,
      admin_email,
      admin_pin,

      google_sheet_url, // Add this here
    } = req.body;

    if (
      !school_name ||
      !school_email ||
      !admin_name ||
      !admin_email ||
      !admin_pin
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // 2. IMPORTANT: Hash the PIN before saving!
    const hashedPin = await bcrypt.hash(String(admin_pin), 10);

    const { data: schoolData, error: schoolError } = await supabase
      .from("schools")
      .insert([
        {
          name: school_name, // Maps 'school_name' to 'name' column
          admin_email: admin_email, // Maps to 'admin_email' column
          pin: hashedPin, // Maps to 'pin' column (make sure to hash first!)
          address: address,
          phone_number: phone, // Maps to 'phone_number' column
          google_sheet_url: google_sheet_url || "", // Insert the link (or empty string)
        },
      ])
      .select()
      .single();

    if (schoolError) throw schoolError;

    const school_id = schoolData.id;

    const admin = await createSchoolAdminService({
      name: admin_name,
      admin_email,
      pin: admin_pin,
      school_id,
    });

    res.status(201).json({
      success: true,
      message: "School and admin registered successfully",
      data: {
        school_id,
        admin_id: admin.id,
      },
    });
  } catch (error) {
    console.error("❌ Register school error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

// 2. LOGIN ADMIN
async function loginSchoolAdmin(req, res) {
  try {
    const { admin_email, pin } = req.body;
    if (!admin_email || !pin) {
      return res
        .status(400)
        .json({ success: false, message: "Email and PIN are required" });
    }

    const admin = await schoolAdminLoginService(admin_email);
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or PIN" });
    }

    const validPin = await bcrypt.compare(String(pin), admin.pin);
    if (!validPin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or PIN" });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.admin_email,
        role: "SCHOOL_ADMIN",
        school_id: admin.school_id,
        name: admin.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
      role: "SCHOOL_ADMIN",
      data: { name: admin.name },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 3. ENHANCED DASHBOARD SUMMARY (The "First Screen" Logic)
async function getDashboardSummary(req, res) {
  try {
    const { school_id } = req.user;

    // Fetch stats using your service
    const stats = await getAdminStatsService(school_id);

    // FIX: Look at fleet counts to decide onboarding status
    // We check stats.stats because that's where the fleet counts live
    const hasFleet =
      stats.stats?.totalStudents > 0 || stats.stats?.activeVans > 0;

    const summary = {
      ...stats,
      needsOnboarding: !hasFleet,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// 4. STUDENTS PAGE
async function getStudentsPage(req, res) {
  try {
    const { school_id } = req.user;
    const students = await getStudentsFullDetailService(school_id);
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 5. VANS DETAIL
async function getVansDetail(req, res) {
  try {
    const { school_id } = req.user;
    const vans = await getVansWithRouteDetails(school_id);
    res.status(200).json({ success: true, data: vans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 6. DRIVERS PAGE
async function getDriversPage(req, res) {
  try {
    const { school_id } = req.user;
    const drivers = await getDriversWithDetails(school_id);
    res.status(200).json({ success: true, data: drivers || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  registerSchool,
  loginSchoolAdmin,
  getDashboardSummary,
  getStudentsPage,
  getVansDetail,
  getDriversPage,
};
