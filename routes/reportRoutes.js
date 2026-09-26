const express = require("express");

const router = express.Router();


const {

    getAttendanceReport,

    getServiceReports,

    getMemberAttendanceReport,

    getFollowUpReport

} = require("../controllers/reportsController");



const {
    protect
} = require("../middleware/authMiddleware");



const checkPermission =
require("../middleware/permissionMiddleware");





// ==========================================
// Attendance Report
// GET /api/reports/attendance/:serviceId
// ==========================================

router.get(

    "/attendance/:serviceId",

    protect,

    checkPermission(
        "VIEW_REPORTS"
    ),

    getAttendanceReport

);







// ==========================================
// Service History Report
// GET /api/reports/services
// ==========================================

router.get(

    "/services",

    protect,

    checkPermission(
        "VIEW_REPORTS"
    ),

    getServiceReports

);







// ==========================================
// Member Attendance Report
// GET /api/reports/member/:memberId
// ==========================================

router.get(

    "/member/:memberId",

    protect,

    checkPermission(
        "VIEW_REPORTS"
    ),

    getMemberAttendanceReport

);







// ==========================================
// Follow Up Report
// GET /api/reports/followups
// ==========================================

router.get(

    "/followups",

    protect,

    checkPermission(
        "VIEW_REPORTS"
    ),

    getFollowUpReport

);




module.exports = router;