// src/routes/superAdminRoutes.js
const express = require("express");
const router = express.Router();
const {
  getSuperAdminStats,
  getAllSchools,
  getAllUsers,
  removeUser,
  approveSchool,
  deleteSchool,
  createSchool,
  updateSchool,
  getSystemReports,
  getPermissions, // <--- Add this
  updateRolePermissions,
} = require("../controllers/superAdminController");
const { authenticate } = require("../middleware/authMiddleware");

// Apply your middleware to all routes in this file
// Only tokens with role: 'SUPER_ADMIN' will pass through
router.use(authenticate(["SUPER_ADMIN"]));

router.get("/stats", getSuperAdminStats);
router.get("/schools", getAllSchools);
router.patch("/schools/:id/approve", approveSchool);
router.get("/users", getAllUsers);
router.delete("/users/:role/:id", removeUser);
router.delete("/schools/:id", deleteSchool);
router.patch("/schools/:id", updateSchool);
router.post("/schools", createSchool);
router.get("/reports", getSystemReports);
router.get("/permissions", getPermissions);
router.post("/permissions/update", updateRolePermissions);

module.exports = router;
