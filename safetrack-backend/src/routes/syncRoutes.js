// src/routes/syncRoutes.js
const express = require("express");
const { assignStudentToVan } = require("../services/syncService");
const {authenticate} = require("../middleware/authMiddleware");

// Require the exported syncParents function
const syncParents = require("../../syncParents");

const router = express.Router();

// Manually trigger parent sync
router.post("/parents", authenticate(["SUPER_ADMIN"]), async (req, res) => {
  try {
    await syncParents(); // call the exported function
    res.status(200).json({ success: true, message: "Parent sync completed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Assign student to van
router.post("/assign-van", authenticate(["SUPER_ADMIN", "SCHOOL_ADMIN"]), async (req, res) => {
  try {
    const { student_name, school_id, plate_number } = req.body;
    await assignStudentToVan(student_name, school_id, plate_number);
    res.status(200).json({ success: true, message: "Student assigned to van" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
