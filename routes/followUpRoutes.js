const express = require("express");

const router = express.Router();


const {

    getFollowUps,

    getFollowUp,

    createFollowUp,

    updateFollowUp,

    getFollowUpStats

} = require("../controllers/followUpController");


const {
    protect
} = require("../middleware/authMiddleware");


const checkPermission =
    require("../middleware/permissionMiddleware");


// =====================================================
// FOLLOW UP STATS
// =====================================================

router.get(

    "/stats",

    protect,

    checkPermission(
        "VIEW_FOLLOWUPS"
    ),

    getFollowUpStats

);


// =====================================================
// GET ALL FOLLOW UPS
// =====================================================

router.get(

    "/",

    protect,

    checkPermission(
        "VIEW_FOLLOWUPS"
    ),

    getFollowUps

);


// =====================================================
// GET SINGLE FOLLOW UP
// =====================================================

router.get(

    "/:id",

    protect,

    checkPermission(
        "VIEW_FOLLOWUPS"
    ),

    getFollowUp

);


// =====================================================
// CREATE FOLLOW UP
// =====================================================

router.post(

    "/",

    protect,

    checkPermission(
        "MANAGE_FOLLOWUPS"
    ),

    createFollowUp

);


// =====================================================
// UPDATE FOLLOW UP
// =====================================================

router.patch(

    "/:id",

    protect,

    checkPermission(
        "MANAGE_FOLLOWUPS"
    ),

    updateFollowUp

);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;