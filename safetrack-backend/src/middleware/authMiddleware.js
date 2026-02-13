// src/middleware/auth.js
const jwt = require("jsonwebtoken");

// Make sure JWT_SECRET exists
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "⚠️ JWT_SECRET is not set! Please set it in your environment variables.",
  );
  process.exit(1);
}

/**
 * Middleware to verify JWT token and optionally restrict roles
 * @param {string[]} allowedRoles - Optional array of roles allowed to access this route
 */
function authenticate(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Missing or malformed token" });
    }

    const token = authHeader.split(" ")[1];

    try {
      // Verify token using the exact same secret used to sign it
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach decoded data to request object
      req.user = decoded;

      // Optional: attach school_id for multi-tenant logic
      if (decoded.school_id) req.school_id = decoded.school_id;

      // Role-based access control
      if (allowedRoles.length > 0) {
        // Convert everything to uppercase for a safe comparison
        const userRole = decoded.role ? decoded.role.toUpperCase() : "";
        const upperAllowedRoles = allowedRoles.map((role) =>
          role.toUpperCase(),
        );

        if (!upperAllowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: ${userRole} does not have access.`, // Added role to message for debugging
          });
        }
      }

      next(); // Everything is fine, proceed
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }
  };
}

module.exports = { authenticate };
