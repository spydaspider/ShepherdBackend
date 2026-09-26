const express = require("express");

const router = express.Router();


// =====================================================
// CONTROLLERS
// =====================================================

const {
    markAttendance,
    adminMarkAttendance,
    getServiceAttendance,
    getAttendanceDashboard,
    updateAttendanceStatus,
    getMyAttendanceHistory,
    getChildAttendanceHistory,
    getSecretaryAttendanceReport
} = require("../controllers/attendanceController");


// =====================================================
// MIDDLEWARE
// =====================================================

const {
    protect
} = require("../middleware/authMiddleware");

const checkPermission =
    require("../middleware/permissionMiddleware");


// =====================================================
// CHILD ATTENDANCE HISTORY
//
// GET /api/attendance/child/:childId
// =====================================================

router.get(
    "/child/:childId",
    protect,
    getChildAttendanceHistory
);


// =====================================================
// MEMBER / PARENT MARK ATTENDANCE
//
// POST /api/attendance/mark
// =====================================================

router.post(
    "/mark",
    protect,
    checkPermission("MARK_ATTENDANCE"),
    markAttendance
);


// =====================================================
// ADMIN MARK ATTENDANCE
//
// POST /api/attendance/admin-mark
// =====================================================

router.post(
    "/admin-mark",
    protect,
    checkPermission("MARK_ATTENDANCE"),
    adminMarkAttendance
);


// =====================================================
// ATTENDANCE DASHBOARD
//
// GET /api/attendance/dashboard
// =====================================================

router.get(
    "/dashboard",
    protect,
    checkPermission("VIEW_ATTENDANCE"),
    getAttendanceDashboard
);


// =====================================================
// MEMBER ATTENDANCE HISTORY
//
// GET /api/attendance/my-history
// =====================================================

router.get(
    "/my-history",
    protect,
    getMyAttendanceHistory
);


// =====================================================
// SECRETARY ATTENDANCE REPORT
//
// GET /api/attendance/secretary-report/:serviceId
//
// Used by:
// - Secretary
// - Pastor
// - Admin
//
// Permission:
// VIEW_ATTENDANCE_REPORT
// =====================================================

router.get(
    "/secretary-report/:serviceId",
    protect,
    checkPermission("VIEW_ATTENDANCE_REPORT"),
    getSecretaryAttendanceReport
);


// =====================================================
// GET ATTENDANCE FOR A SERVICE
//
// GET /api/attendance/service/:serviceId
// =====================================================

router.get(
    "/service/:serviceId",
    protect,
    checkPermission("VIEW_ATTENDANCE"),
    getServiceAttendance
);


// =====================================================
// UPDATE ATTENDANCE STATUS
//
// PATCH /api/attendance/:id
// =====================================================

router.patch(
    "/:id",
    protect,
    checkPermission("UPDATE_ATTENDANCE"),
    updateAttendanceStatus
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;