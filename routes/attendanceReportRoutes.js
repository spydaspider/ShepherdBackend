const express = require("express");

const router = express.Router();

const { getAttendanceReport } = require("../controllers/attendanceReportController");

const { protect } = require("../middleware/authMiddleware");

router.get("/:serviceId", protect, getAttendanceReport);

module.exports = router;