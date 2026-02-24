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

  console.log(`🚀 [Handover] Starting ${action} for Student: ${studentId}`);

  try {
    const { data: student, error: fetchError } = await supabase
      .from("students")
      .select("id, name, guardian_pin, handover_token, assigned_van_id, status, school_id")
      .eq("id", studentId)
      .single();

    if (fetchError || !student) {
      console.error("❌ [Handover] Student not found:", studentId);
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // --- VERIFICATION LOGIC ---
    if (method === "QR_SCAN") {
      if (student.handover_token === scannedToken) {
        console.log(`✅ [Handover] QR Match for ${student.name}`);
      } else {
        console.warn(`⚠️ [Handover] QR Mismatch for ${student.name}`);
        return res.status(403).json({ success: false, message: "Invalid QR Code" });
      }
    } else {
      const dbPin = String(student.guardian_pin).trim();
      const inputPin = String(pin || "").trim();
      if (dbPin !== inputPin) {
        console.warn(`⚠️ [Handover] PIN Incorrect for ${student.name}`);
        return res.status(401).json({ success: false, message: "Incorrect Security PIN" });
      }
      console.log(`✅ [Handover] PIN Match for ${student.name}`);
    }

    // 4️⃣ Update student status
    const isPickup = action === "picked_up";
    console.log(`db status to update: ${isPickup ? "picked_up" : "dropped_off"}`);
    
    const { error: updateError } = await supabase
      .from("students")
      .update({
        status: isPickup ? "picked_up" : "dropped_off",
        is_on_bus: isPickup,
        [isPickup ? "last_pickup_time" : "last_dropoff_time"]: new Date().toISOString(),
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("❌ [Handover] Student Table Update Error:", updateError.message);
      throw updateError;
    }

    // 5️⃣ Audit Log (Fixing column names + adding error capture)
    console.log("📝 [Handover] Attempting to write to pickup_logs...");
    
    const { data: logData, error: logError } = await supabase
      .from("pickup_logs")
      .insert({
        student_id: studentId,
        driver_id: req.user?.id, // 🛡️ req.user.id depends on auth middleware
        van_id: student.assigned_van_id,
        school_id: student.school_id,
        verification_hash: method,
        latitude: lat || null,  // 🟢 Verified column name
    longitude: lng || null,
        action_type: isPickup ? "pickup" : "dropoff",
        scanned_at: new Date().toISOString()
      })
      .select();

    if (logError) {
      console.error("💥 [Handover] Pickup Logs INSERT Error:", logError.message);
      console.error("💥 [Handover] Details:", logError);
      // We don't throw here so the driver still gets a success for the student status, 
      // but we will see the error in the Render logs.
    } else {
      console.log("✅ [Handover] Pickup Log saved successfully:", logData[0].id);
    }

    res.status(200).json({ success: true, message: "Verification successful" });

  } catch (err) {
    console.error("🔥 [Handover] Critical System Error:", err.message);
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
