const express = require("express");
const {
  loginDriver,
  createDriver,
  getDriverDashboard,
  finishRoute,
  verifyStudentHandover, // Import the new verification function
} = require("../controllers/driverController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Public login
router.post("/login", loginDriver);

// Protected creation (SUPER_ADMIN or SCHOOL_ADMIN)
router.post("/", authenticate(["SUPER_ADMIN", "SCHOOL_ADMIN"]), createDriver);

// Protected driver dashboard
router.get("/dashboard", authenticate(["DRIVER"]), getDriverDashboard);
router.post("/route/finish", authenticate(["DRIVER"]), finishRoute);
// Add a simple log to see if the request even HITS this file
router.post('/students/:studentId/verify', (req, res, next) => {
    console.log("🚀 Verify route hit! ID:", req.params.studentId);
    next();
}, authenticate(["DRIVER"]), verifyStudentHandover);
module.exports = router;
