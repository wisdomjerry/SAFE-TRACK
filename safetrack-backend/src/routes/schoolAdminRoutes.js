const express = require("express");
const {
  loginSchoolAdmin,
  getStudentsPage,
  getVansDetail,
  getDriversPage,
  getDashboardSummary,
  registerSchool,
} = require("../controllers/schoolAdminController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/login", loginSchoolAdmin);
router.post("/register", registerSchool);

// Protected (School Admin only)
router.get("/stats", authenticate(["SCHOOL_ADMIN"]), getDashboardSummary);
router.get(
  "/dashboard-summary",
  authenticate(["SCHOOL_ADMIN"]),
  getDashboardSummary,
);
// ADD THIS LINE to fix the 404:
router.get("/summary", authenticate(["SCHOOL_ADMIN"]), getDashboardSummary);

router.get("/students", authenticate(["SCHOOL_ADMIN"]), getStudentsPage);
router.get("/vans-detail", authenticate(["SCHOOL_ADMIN"]), getVansDetail);
router.get("/drivers-detail", authenticate(["SCHOOL_ADMIN"]), getDriversPage);

module.exports = router;
