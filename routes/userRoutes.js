const express = require("express");

const router =
    express.Router();


const {
    protect
} = require("../middleware/authMiddleware");


const {

    getUsers,

    getFamily,

    addChild,

    updateChild,

    removeChild

} = require("../controllers/userController");


// =====================================================
// PROFILE
// GET /api/users/profile
// =====================================================

router.get(

    "/profile",

    protect,

    (req, res) => {

        return res.json({

            success: true,

            user: req.user

        });

    }

);


// =====================================================
// FAMILY
// GET /api/users/family
// =====================================================

router.get(

    "/family",

    protect,

    getFamily

);


// =====================================================
// ADD CHILD
// POST /api/users/family/children
// =====================================================

router.post(

    "/family/children",

    protect,

    addChild

);


// =====================================================
// UPDATE CHILD
// PATCH /api/users/family/children/:childId
// =====================================================

router.patch(

    "/family/children/:childId",

    protect,

    updateChild

);


// =====================================================
// REMOVE CHILD
// PATCH /api/users/family/children/:childId/remove
// =====================================================

router.patch(

    "/family/children/:childId/remove",

    protect,

    removeChild

);


// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

router.get(

    "/",

    protect,

    getUsers

);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;