// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  unifiedLogin,
  getProfile,
  sendNotification,
  getNotifications,
  markNotificationsRead,
  startOtpLogin,
  verifyOtp,
  setPin,
  updatePassword,
  updateProfile,
  toggleBiometric
} = require("../controllers/authController");
const { authenticate  } = require("../middleware/authMiddleware");

/**
 * @route   POST /api/auth/login
 * @desc    Unified login for all roles (identifies role via DB check)
 * @access  Public
 */
router.post("/unified-login", unifiedLogin);

/**
 * Optional: Logout route
 * Since we use JWT, logout is mostly handled by the frontend
 * (deleting the token), but you can add this for logging/auditing.
 */
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// Add your verifyToken middleware here
// Use authenticate instead of verifyToken
router.get("/me", authenticate(), getProfile);

// Password and Profile Management
router.post("/update-password", authenticate(), updatePassword);
router.put("/update-profile", authenticate(), updateProfile);
router.post("/toggle-biometric", authenticate(), toggleBiometric);

router.post("/notifications", authenticate(), sendNotification);
router.get("/notifications", authenticate(), getNotifications);
router.put("/notifications/read", authenticate(), markNotificationsRead);

// Example: if a route is only for SCHOOL_ADMIN
router.get("/school/stats", authenticate(["SCHOOL_ADMIN"]), getProfile);
router.post("/start-otp", startOtpLogin);
router.post("/verify-otp", verifyOtp);
router.post("/set-pin", setPin);
module.exports = router;
