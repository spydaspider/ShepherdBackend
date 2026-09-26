const express = require("express");

const router = express.Router();



// Controllers
const {

    getMembers,

    getParents,

    getMemberById,

    getMyDashboard,

    createMember,

    updateMember,

    changeMemberStatus


} = require("../controllers/memberController");




// Middleware
const {
    protect

} = require("../middleware/authMiddleware");



const checkPermission =
require("../middleware/permissionMiddleware");








// =====================================================
// GET ALL MEMBERS
// GET /api/members
// =====================================================

router.get(

    "/",

    protect,

    checkPermission(
        "VIEW_MEMBERS"
    ),

    getMembers

);









// =====================================================
// GET PARENTS
// GET /api/members/parents
//
// Used when creating child members
// Returns only adult members
// =====================================================

router.get(

    "/parents",

    protect,

    checkPermission(
        "VIEW_MEMBERS"
    ),

    getParents

);









// =====================================================
// CREATE MEMBER
// POST /api/members
// =====================================================

router.post(

    "/",

    protect,

    checkPermission(
        "CREATE_USER"
    ),

    createMember

);




// =====================================================
// GET CURRENT MEMBER DASHBOARD
// GET /api/members/me/dashboard
// =====================================================

router.get(

    "/me/dashboard",

    protect,

    getMyDashboard

);




// =====================================================
// UPDATE MEMBER
// PATCH /api/members/:id
// =====================================================

router.patch(

    "/:id",

    protect,

    checkPermission(
        "UPDATE_USER"
    ),

    updateMember

);









// =====================================================
// CHANGE MEMBER STATUS
// PATCH /api/members/:id/status
// =====================================================

router.patch(

    "/:id/status",

    protect,

    checkPermission(
        "UPDATE_USER"
    ),

    changeMemberStatus

);









// =====================================================
// GET SINGLE MEMBER PROFILE
// GET /api/members/:id
// =====================================================

router.get(

    "/:id",

    protect,

    checkPermission(
        "VIEW_PROFILE"
    ),

    getMemberById

);








module.exports = router;