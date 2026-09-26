const express = require("express");

const router = express.Router();



const {

    getDashboard,

    getOverview,

    getServiceDashboard


} = require("../controllers/dashboardController");



const {

    protect

} = require("../middleware/authMiddleware");



const checkPermission =
require("../middleware/permissionMiddleware");









// =================================================
// Main Admin Dashboard
// GET /api/dashboard
// =================================================


router.get(

    "/",

    protect,

    checkPermission(
        "VIEW_DASHBOARD"
    ),

    getDashboard

);









// =================================================
// Church Overview
// GET /api/dashboard/overview
// =================================================


router.get(

    "/overview",

    protect,

    checkPermission(
        "VIEW_DASHBOARD"
    ),

    getOverview

);









// =================================================
// Single Service Dashboard
// GET /api/dashboard/service/:serviceId
// =================================================


router.get(

    "/service/:serviceId",

    protect,

    checkPermission(
        "VIEW_DASHBOARD"
    ),

    getServiceDashboard

);









module.exports = router;