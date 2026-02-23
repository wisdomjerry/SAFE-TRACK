const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  parentLoginService,
  createParentService,
  getParentChildrenService,
  updateStudentGuardianPin,
  updateHomeLocationService
} = require("../services/parentService");
const { getChildAttendanceHistory } = require("../services/parentService");
const { supabase } = require("../config/supabaseClient");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// LOGIN
async function loginParent(req, res) {
  try {
    const { phone_number, pin } = req.body;
    if (!phone_number || !pin) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number and PIN are required" });
    }

    const parent = await parentLoginService(phone_number);
    if (!parent) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid phone number or PIN" });
    }

    // Compare hashed PIN
    const validPin = await bcrypt.compare(pin, parent.pin);
    if (!validPin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid phone number or PIN" });
    }

    // Issue JWT
    const token = jwt.sign(
      {
        id: parent.id,
        phone_number: parent.phone_number,
        role: "PARENT",
        school_id: parent.school_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        full_name: parent.full_name, // Add this
        phone_number: parent.phone_number,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// CREATE PARENT
async function createParent(req, res) {
  try {
    const { full_name, phone_number, pin, school_id } = req.body;
    if (!full_name || !phone_number || !pin || !school_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const parent = await createParentService({
      full_name,
      phone_number,
      pin,
      school_id,
    });

    res.status(201).json({ success: true, data: parent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// GET CHILDREN (for logged-in parent)
async function getChildren(req, res) {
  try {
    const parent_id = req.user.id;

    // Use the service that joins Vans and Drivers
    const children = await getParentChildrenService(parent_id);

    res.status(200).json({
      success: true,
      data: children,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getHistory(req, res) {
  try {
    const { studentId } = req.params;

    // 🛑 GUARD CLAUSE: Check if studentId is missing or the string "undefined"
    if (!studentId || studentId === "undefined") {
      console.warn("⚠️ History requested with invalid studentId:", studentId);
      return res.status(400).json({
        success: false,
        message: "A valid Student ID is required to fetch history.",
      });
    }

    // Security check: The studentId is now guaranteed to be a real value
    const history = await getChildAttendanceHistory(studentId);

    res.status(200).json({
      success: true,
      data: history || [],
    });
  } catch (error) {
    console.error("💥 History Controller Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching history.",
    });
  }
}

async function setGuardianPin(req, res) {
  try {
    const { studentId } = req.params;
    // Check for 'newPin' OR 'guardian_pin' to prevent 400 errors
    const pinToSet = req.body.newPin || req.body.guardian_pin;
    const parent_id = req.user.id;

    console.log(`Updating Student: ${studentId} with PIN: ${pinToSet}`);

    if (!pinToSet || pinToSet.length !== 6) {
      return res
        .status(400)
        .json({ success: false, message: "PIN must be exactly 6 digits" });
    }

    // Call your service
    const data = await updateStudentGuardianPin(studentId, parent_id, pinToSet);

    res.status(200).json({
      success: true,
      message: "Guardian PIN updated successfully",
      data,
    });
  } catch (error) {
    console.error("setGuardianPin Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

// UPDATE HOME LOCATION
async function updateHomeLocation(req, res) {
  try {
    const { id } = req.params;
    const { home_lat, home_lng } = req.body;

    if (!id || home_lat === undefined || home_lng === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing student ID or coordinates" 
      });
    }

    // Call the service
    const data = await updateHomeLocationService(id, home_lat, home_lng);

    res.status(200).json({
      success: true,
      message: "Home location updated successfully",
      data,
    });
  } catch (error) {
    console.error("updateHomeLocation Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  loginParent,
  createParent,
  getChildren,
  getHistory,
  setGuardianPin,
  updateHomeLocation,
};
