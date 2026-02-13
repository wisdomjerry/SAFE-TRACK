const express = require("express");
const {
  loginParent,
  createParent,
  getChildren,
  getHistory,
  setGuardianPin,
} = require("../controllers/parentController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Parent login (public)
router.post("/login", loginParent);

// Create parent (protected, only SUPER_ADMIN or SCHOOL_ADMIN)
router.post("/", authenticate(["SUPER_ADMIN", "SCHOOL_ADMIN"]), createParent);

// Get children for logged-in parent (protected)
router.get("/children", authenticate(["PARENT"]), getChildren);

router.get("/history/:studentId", authenticate(["PARENT"]), getHistory);

router.patch(
  "/students/:studentId/guardian-pin",
  authenticate(["PARENT"]),
  setGuardianPin,
);

module.exports = router;
