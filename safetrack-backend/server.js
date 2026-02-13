require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { supabase } = require("./src/config/supabaseClient");

const authRoutes = require("./src/routes/authRoutes");
const driverRoutes = require("./src/routes/driverRoutes");
const syncRoutes = require("./src/routes/syncRoutes");
const parentRoutes = require("./src/routes/parentRoutes");
const schoolAdminRoutes = require("./src/routes/schoolAdminRoutes");
const superAdminRoutes = require("./src/routes/superAdminRoutes");

const app = express();

// Middleware

// 1. Define all allowed origins
const allowedOrigins = [
  "http://localhost:5173",              // Local Dev
  "https://safe-track-zeta.vercel.app",  // Web Production
  "capacitor://localhost",               // iOS App
  "http://localhost",                    // Android App (Standard)
  "https://localhost",                   // Android App (If using HTTPS scheme)
];

// 2. Configure CORS with dynamic origin check
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("CORS Blocked for origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("School Van System API is running...");
});

// API Routes
app.use("/api/drivers", driverRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/school", schoolAdminRoutes);
app.use("/api/admin", superAdminRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/auth", authRoutes);

// Add this near your other routes

app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    message: 'Keeping Render awake!',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler (Good practice to catch unexpected crashes)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Schedule to run every day at midnight (00:00)
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("🕛 Midnight Reset: Preparing for a new school day...");

    try {
      // 1. Get all students to generate unique pins for each
      const { data: students, error: fetchError } = await supabase
        .from("students")
        .select("id");

      if (fetchError) throw fetchError;

      // 2. Perform the update for all students
      // We reset status, clear bus flag, and generate a fresh 6-digit Morning PIN
      const updates = students.map((student) => ({
        id: student.id,
        status: "waiting",
        is_on_bus: false,
        guardian_pin: Math.floor(100000 + Math.random() * 900000).toString(),
      }));

      const { error: updateError } = await supabase
        .from("students")
        .upsert(updates);

      if (updateError) throw updateError;

      console.log(
        `✅ Successfully reset ${updates.length} students for the new day.`,
      );
    } catch (err) {
      console.error("❌ Midnight Reset Failed:", err.message);
    }
  },
  {
    scheduled: true,
    timezone: "Africa/Kampala", // Set to your local timezone
  },
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
