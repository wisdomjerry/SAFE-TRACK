const { supabase } = require("../config/supabaseClient");
const {
  driverLoginService,
  createDriverService,
  getDriverDashboardService,
  finishRouteService,
} = require("../services/driverService");

// ------------------- LOGIN DRIVER -------------------
async function loginDriver(req, res) {
  try {
    const { phone_number, pin } = req.body;
    if (!phone_number || !pin) {
      return res.status(400).json({
        success: false,
        message: "Phone number and PIN are required",
      });
    }

    const { driver, token } = await driverLoginService(phone_number, pin);
    res.status(200).json({ success: true, driver, token });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(401).json({ success: false, message: err.message });
  }
}

// ------------------- CREATE DRIVER -------------------
async function createDriver(req, res) {
  try {
    const { full_name, phone_number, license_number, pin, school_id, assigned_van_id } = req.body;

    if (!full_name || !phone_number || !license_number || !pin || !school_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const driver = await createDriverService({
      full_name,
      phone_number,
      license_number,
      pin,
      school_id,
      assigned_van_id,
    });

    res.status(201).json({ success: true, data: driver });
  } catch (err) {
    console.error("Create Driver Error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

// ------------------- DRIVER DASHBOARD -------------------
async function getDriverDashboard(req, res) {
  try {
    const { id, school_id } = req.user;
    const dashboard = await getDriverDashboardService(id, school_id);
    res.status(200).json({ success: true, ...dashboard });
  } catch (err) {
    console.error("Dashboard Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ------------------- FINISH ROUTE -------------------
async function finishRoute(req, res) {
  try {
    const { assigned_van_id, school_id } = req.user;
    await finishRouteService(assigned_van_id, school_id);
    res.status(200).json({
      success: true,
      message: "Route finalized successfully",
    });
  } catch (err) {
    console.error("Finish Route Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ------------------- VERIFY STUDENT HANDOVER -------------------
async function verifyStudentHandover(req, res) {
  const { studentId } = req.params;
  const { pin, method, action, lat, lng, scannedToken } = req.body;

  try {
    const { data: student, error: fetchError } = await supabase
      .from("students")
      .select("id, name, guardian_pin, handover_token, assigned_van_id, status, school_id")
      .eq("id", studentId)
      .single();

    if (fetchError || !student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // --- STANDALONE LOGIC START ---
    
    if (method === "QR_SCAN") {
      // If QR matches, we skip the PIN check entirely
      if (student.handover_token === scannedToken) {
        console.log(`✅ QR Match for ${student.name}`);
      } else {
        return res.status(403).json({ success: false, message: "Invalid QR Code" });
      }
    } else {
      // If MANUAL_PIN, we check the PIN
      const dbPin = String(student.guardian_pin).trim();
      const inputPin = String(pin || "").trim();
      if (dbPin !== inputPin) {
        return res.status(401).json({ success: false, message: "Incorrect Security PIN" });
      }
      console.log(`✅ PIN Match for ${student.name}`);
    }

    // --- STANDALONE LOGIC END ---

    // 4️⃣ Update student status
    const isPickup = action === "picked_up";
    const { error: updateError } = await supabase
      .from("students")
      .update({
        status: isPickup ? "picked_up" : "dropped_off",
        is_on_bus: isPickup,
        [isPickup ? "last_pickup_time" : "last_dropoff_time"]: new Date().toISOString(),
      })
      .eq("id", studentId);

    if (updateError) throw updateError;

    // 5️⃣ Audit Log
    await supabase.from("pickup_logs").insert({
      student_id: studentId,
      driver_id: req.user.id, // Ensure this is coming from your auth middleware
      van_id: student.assigned_van_id,
      school_id: student.school_id,
      verification_hash: method,
      latitude: lat || null,
      longitude: lng || null,
      action_type: isPickup ? "pickup" : "dropoff",
      scanned_at: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: "Verification successful" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  loginDriver,
  createDriver,
  getDriverDashboard,
  finishRoute,
  verifyStudentHandover,
};
