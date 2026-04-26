const express = require("express");
const router = express.Router();
const { checkIn, getMyAttendance, getWeeklySummary} = require("../controllers/attendance.controller");
const { verifyToken } = require("../middleware/auth");
const { checkGeofence } = require("../middleware/geofence");
const { checkDevice } = require("../middleware/deviceCheck");

// All attendance routes require a valid JWT
router.use(verifyToken);

// Check-in goes through 3 layers: JWT → Geofence → Device check
router.post("/check-in", checkGeofence, checkDevice, checkIn);

// Get student's own attendance (optionally filtered by unit code)
router.get("/my", getMyAttendance);

module.exports = router;
