const express = require("express");
const {
  loginParent,
  createParent,
  getChildren,
  getHistory,
  setGuardianPin,
  updateHomeLocation
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

// backend/routes/parents.js

// Make sure the path matches exactly what the frontend is sending
router.patch('/students/:id/home-location', authenticate(["PARENT"]), async (req, res) => {
    const { id } = req.params;
    const { home_lat, home_lng } = req.body;

    try {
        const { data, error } = await supabase
            .from('students')
            .update({ home_lat, home_lng })
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: 'Home location updated successfully', data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

router.patch(
  "/students/:studentId/guardian-pin",
  authenticate(["PARENT"]),
  setGuardianPin,
);

module.exports = router;
