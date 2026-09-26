const express = require("express");

const router = express.Router();

const {
    createService,
    getActiveService,
    endService,
    getServices,
    getServiceById
} = require("../controllers/serviceController");

const {
    protect
} = require("../middleware/authMiddleware");

const checkPermission = require("../middleware/permissionMiddleware");


// =====================================================
// Create Service
// POST /api/services
// =====================================================

router.post(
    "/",
    protect,
    checkPermission("CREATE_SERVICE"),
    createService
);


// =====================================================
// Get All Services
// GET /api/services
// =====================================================

router.get(
    "/",
    protect,
    checkPermission("VIEW_SERVICES"),
    getServices
);


// =====================================================
// Get Active Service
// GET /api/services/active
// =====================================================

router.get(
    "/active",
    protect,
    getActiveService
);


// =====================================================
// Get Service By ID
// GET /api/services/:id
// =====================================================

router.get(
    "/:id",
    protect,
    checkPermission("VIEW_SERVICES"),
    getServiceById
);


// =====================================================
// End Service
// PATCH /api/services/:id/end
// =====================================================

router.patch(
    "/:id/end",
    protect,
    checkPermission("END_SERVICE"),
    endService
);

module.exports = router;