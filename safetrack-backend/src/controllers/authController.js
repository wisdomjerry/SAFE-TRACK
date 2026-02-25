// src/controllers/authController.js
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Initialize Supabase (Ensure these are in your .env file)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const unifiedLogin = async (req, res) => {
  const { identifier, phone_number, phone, admin_email, pin } = req.body;
  const rawHandle = identifier || phone_number || admin_email || phone;

  if (!rawHandle || !pin) {
    return res
      .status(400)
      .json({ success: false, message: "Credentials and PIN are required." });
  }

  const isEmail = rawHandle.includes("@");
  const loginHandle = isEmail
    ? rawHandle.trim().toLowerCase()
    : normalizePhone(rawHandle);

  console.log("-----------------------------------------");
  console.log("🚀 LOGIN ATTEMPT:", loginHandle);

  try {
    const roles = [
      { role: "SUPER_ADMIN", table: "profiles", column: "email" },
      { role: "SCHOOL_ADMIN", table: "schools", column: "admin_email" },
      { role: "DRIVER", table: "drivers", column: "phone_number" },
      { role: "PARENT", table: "parents", column: "phone_number" },
    ];

    let matchedUser = null;
    let detectedRole = null;

    for (const entry of roles) {
      // Skip tables that don't match the input type (Email vs Phone)
      if (isEmail && entry.column === "phone_number") continue;
      if (!isEmail && entry.column === "admin_email") continue;

      console.log(`🔍 CHECKING TABLE: [${entry.table}]...`);

      const { data: user, error } = await supabase
        .from(entry.table)
        .select("*")
        .eq(entry.column, loginHandle)
        .maybeSingle();

      if (error) console.error(`❌ DB Error [${entry.table}]:`, error.message);

      if (user) {
        console.log(
          `👤 Found user record in [${entry.table}]. Verifying credentials...`,
        );

        let isPinValid = false;

        // --- SUPER ADMIN BYPASS LOGIC ---
        if (entry.role === "SUPER_ADMIN") {
          // Check for plain text "123456" OR a valid bcrypt hash
          const isDirectMatch = String(pin) === "123456";
          const isHashMatch = await bcrypt
            .compare(String(pin), user.pin)
            .catch(() => false);

          isPinValid = isDirectMatch || isHashMatch;

          if (isPinValid) console.log("🔓 Super Admin access granted!");
        } else {
          // Standard check for everyone else
          isPinValid = await bcrypt
            .compare(String(pin), user.pin)
            .catch(() => false);
        }

        if (isPinValid) {
          matchedUser = user;
          detectedRole = entry.role;
          break; // EXIT LOOP - We found our person!
        } else {
          console.log(
            `❌ PIN mismatch in [${entry.table}]. Moving to next possible role...`,
          );
          // The loop continues to the next table in the 'roles' array
        }
      } else {
        console.log(`ℹ️ No matching identifier in [${entry.table}].`);
      }
    }

    if (!matchedUser) {
      console.log("⚠️ LOGIN FAILED: Tried all tables, no match found.");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check your details and PIN.",
      });
    }

    // --- GENERATE JWT (Rest of your code remains the same) ---
    const token = jwt.sign(
      {
        id: matchedUser.id,
        role: detectedRole,
        school_id: matchedUser.school_id || matchedUser.id,
        name:
          matchedUser.full_name || matchedUser.name || matchedUser.school_name,
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" },
    );

    console.log(`✅ SUCCESS: [${detectedRole}] Logged in!`);
    res.status(200).json({
      success: true,
      token,
      role: detectedRole,
      data: {
        id: matchedUser.id,
        name:
          matchedUser.full_name || matchedUser.name || matchedUser.school_name,
        school_id: matchedUser.school_id || matchedUser.id,
        google_sheet_url: matchedUser.google_sheet_url || null,
      },
    });
  } catch (error) {
    console.error("💥 SERVER ERROR:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user; // Set by your JWT middleware

    // Map roles to table names
    const tableMap = {
      SUPER_ADMIN: "profiles",
      SCHOOL_ADMIN: "schools",
      DRIVER: "drivers",
      PARENT: "parents",
    };

    const tableName = tableMap[role];

    if (!tableName) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const { data, error } = await supabase
      .from(tableName)
      .select("*") // This will now include google_sheet_url if you added the column
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "User not found" });
    }

    // We structure the response so the frontend knows exactly where to look
    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.full_name || data.school_name || data.name,
        role: role,
        school_id: data.school_id || data.id,
        avatar_url: data.avatar_url || null,
        // We explicitly pass this so the Sidebar can see it
        google_sheet_url: data.google_sheet_url || null,
        details: data,
      },
    });
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const sendNotification = async (req, res) => {
  const { title, message, type, driver_id } = req.body;

  // req.user comes from your verifyToken middleware
  const { school_id, id: adminId } = req.user;

  try {
    const { data, error } = await supabase.from("notifications").insert([
      {
        school_id,
        driver_id: driver_id || null,
        title,
        message,
        type: type || "info",
        sender_name: req.user.name || "School Admin",
      },
    ]);

    if (error) throw error;
    res.status(201).json({ success: true, message: "Notification sent!" });
  } catch (error) {
    console.error("Notification Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getNotifications = async (req, res) => {
  const { school_id, id: driverId } = req.user;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("school_id", school_id)
      // Slack logic: Show if it's for everyone (null) OR specifically for this driver
      .or(`driver_id.is.null,driver_id.eq.${driverId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  const { school_id, id: driverId } = req.user;

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("school_id", school_id)
      .or(`driver_id.is.null,driver_id.eq.${driverId}`)
      .eq("is_read", false);

    if (error) throw error;
    res.json({ success: true, message: "All caught up!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const normalizePhone = (phone) => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // If it already starts with 256 and is 12 digits long, it's already normalized
  if (cleaned.length === 12 && cleaned.startsWith("256")) {
    return cleaned;
  }

  // If it's a 9-digit number starting with 7, add the 256 prefix
  if (cleaned.length === 9 && cleaned.startsWith("7")) {
    return "256" + cleaned;
  }

  // If it starts with 0, replace 0 with 256
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return "256" + cleaned.substring(1);
  }

  return cleaned;
};

const startOtpLogin = async (req, res) => {
  const { phone, phone_number, reason } = req.body; // Added 'reason' here
  const rawPhone = phone || phone_number;

  if (!rawPhone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const normalizedPhone = normalizePhone(rawPhone);
  console.log("🔎 Searching for User with Phone:", normalizedPhone);

  try {
    const { data: parent } = await supabase
      .from("parents")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();

    const { data: driver } = await supabase
      .from("drivers")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();
    
    const { data: school } = await supabase
      .from("schools")
      .select("*")
      .eq("admin_email", rawPhone)
      .maybeSingle();

    const user = parent || driver || school;

    if (!user) {
      console.log("❌ No user found in Database for:", normalizedPhone);
      return res
        .status(404)
        .json({ message: "Account not found. Contact school." });
    }

    console.log("👤 User Found:", user.full_name || user.name);
    
    // --- UPDATED LOGIC ---
    // If they have a PIN, and the reason is NOT "reset", send them to login
    if (user.pin && user.pin.length > 0 && reason !== "reset") {
      console.log(`✅ User ${normalizedPhone} has a PIN. Skipping OTP for standard login.`);
      return res.json({
        success: true,
        step: "ENTER_PIN",
      });
    }

    // If reason is "reset", we IGNORE the existing PIN and send a new OTP
    console.log("➡️ Directing to OTP Activation/Reset");
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase.from("otps").insert([
      {
        phone: normalizedPhone,
        code: otp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      },
    ]);

    // Return dev_otp so the frontend toaster can catch it
    return res.json({
      success: true,
      message: "OTP generated",
      step: "VERIFY_OTP",
      dev_otp: otp, 
    });
  } catch (error) {
    console.error("💥 Start Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { phone, phone_number, otp } = req.body;
  const rawPhone = phone || phone_number;

  if (!rawPhone || !otp) {
    return res.status(400).json({ message: "Phone and OTP required" });
  }

  const normalizedPhone = normalizePhone(rawPhone);

  try {
    const { data: record } = await supabase
      .from("otps")
      .select("*")
      .eq("phone", normalizedPhone)
      .eq("code", otp)
      .eq("used", false)
      .maybeSingle();

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark OTP as used
    await supabase.from("otps").update({ used: true }).eq("id", record.id);

    return res.json({ step: "SET_PIN" });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const setPin = async (req, res) => {
  const { phone, phone_number, pin, new_pin } = req.body;
  const rawPhone = phone || phone_number;
  const rawPin = pin || new_pin;

  if (!rawPhone || !rawPin) {
    return res.status(400).json({ message: "Phone and PIN required" });
  }

  const normalizedPhone = normalizePhone(rawPhone);

  try {
    let { data: parent } = await supabase
      .from("parents")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();

    let role = "PARENT";
    let table = "parents";

    if (!parent) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("*")
        .eq("phone_number", normalizedPhone)
        .maybeSingle();

      if (!driver) {
        return res.status(404).json({ message: "User not found" });
      }

      parent = driver;
      role = "DRIVER";
      table = "drivers";
    }

    const hashedPin = await bcrypt.hash(String(pin), 10);

    await supabase
      .from(table)
      .update({
        pin: hashedPin,
      })
      .eq("id", parent.id);

    const token = jwt.sign(
      {
        id: parent.id,
        role,
        school_id: parent.school_id,
        name: parent.full_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({ success: true, token });
  } catch (error) {
    console.error("Set PIN Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 1. Update Password
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const { id, role } = req.user; // From JWT middleware

        const tableMap = {
            SUPER_ADMIN: "profiles",
            SCHOOL_ADMIN: "schools",
            DRIVER: "drivers",
            PARENT: "parents",
        };

        const tableName = tableMap[role];

        // 1. Fetch the user to get current hashed PIN
        const { data: user, error: fetchError } = await supabase
            .from(tableName)
            .select("pin")
            .eq("id", id)
            .single();

        if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

        // 2. Compare current PIN
        const isMatch = await bcrypt.compare(String(currentPassword), user.pin);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current PIN is incorrect' });
        }

        // 3. Hash and Save new PIN
        const hashedPin = await bcrypt.hash(String(newPassword), 10);
        const { error: updateError } = await supabase
            .from(tableName)
            .update({ pin: hashedPin })
            .eq("id", id);

        if (updateError) throw updateError;

        res.status(200).json({ success: true, message: 'PIN updated successfully' });
    } catch (err) {
        console.error("Update Password Error:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. Update Profile (Phone, Location, etc.)
const updateProfile = async (req, res) => {
    try {
        const { phone, location, name } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { phone, location, name } },
            { new: true }
        );
        res.status(200).json({ data: user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// 3. Toggle Biometric (Server-side flag)
const toggleBiometric = async (req, res) => {
    try {
        const { enabled } = req.body;
        const { id, role } = req.user;

        const tableMap = {
            SUPER_ADMIN: "profiles",
            SCHOOL_ADMIN: "schools",
            DRIVER: "drivers",
            PARENT: "parents",
        };

        const { error } = await supabase
            .from(tableMap[role])
            .update({ biometric_enabled: enabled })
            .eq("id", id);

        if (error) throw error;
        res.status(200).json({ success: true, message: `Biometrics ${enabled ? 'enabled' : 'disabled'}` });
    } catch (err) {
        res.status(500).json({ message: 'Operation failed' });
    }
};

module.exports = {
  unifiedLogin,
  getProfile,
  sendNotification,
  getNotifications,
  markNotificationsRead,
  normalizePhone,
  startOtpLogin,
  verifyOtp,
  setPin,
  updatePassword,
  updateProfile,
  toggleBiometric,
  
};
