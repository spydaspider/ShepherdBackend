const express = require("express");

const router = express.Router();


const {
    registerUser,
    loginUser,
    createMemberAccount,
    changePassword,
    forgotPassword,
    verifyResetCode,
    resetPassword
} = require("../controllers/authController");


const {
    protect
} = require("../middleware/authMiddleware");


const checkPermission =
    require("../middleware/permissionMiddleware");


// =====================================
// Public Registration
// POST /api/auth/register
// =====================================

router.post(
    "/register",
    registerUser
);


// =====================================
// Login
// POST /api/auth/login
// =====================================

router.post(
    "/login",
    loginUser
);


// =====================================
// Change Password
// PATCH /api/auth/change-password
// =====================================
//
// User must be logged in.
//
// =====================================

router.patch(
    "/change-password",
    protect,
    changePassword
);
// =====================================
// Forgot Password
// POST /api/auth/forgot-password
// =====================================

router.post(
    "/forgot-password",
    forgotPassword
);


// =====================================
// Verify Password Reset Code
// POST /api/auth/verify-reset-code
// =====================================

router.post(
    "/verify-reset-code",
    verifyResetCode
);


// =====================================
// Reset Password
// POST /api/auth/reset-password
// =====================================

router.post(
    "/reset-password",
    resetPassword
);

// =====================================
// Admin Creates Login Account
// POST /api/auth/create-account/:id
// =====================================

router.post(
    "/create-account/:id",
    protect,
    checkPermission("CREATE_ACCOUNT"),
    createMemberAccount
);


module.exports = router;