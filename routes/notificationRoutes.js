const express = require("express");

const router = express.Router();



const {

    createNotification,

    createBulkNotifications,

    getNotifications,

    getUnreadNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification


} = require("../controllers/notificationController");



const {
    protect
} = require("../middleware/authMiddleware");



const checkPermission =
require("../middleware/permissionMiddleware");







// ==========================================
// Admin Create Notification
// POST /api/notifications
// ==========================================

router.post(

    "/",

    protect,

    checkPermission(
        "MANAGE_NOTIFICATIONS"
    ),

    createNotification

);









// ==========================================
// Admin Create Bulk Notifications
// Used for:
// - Service announcements
// - Follow up assignments
// - Church alerts
//
// POST /api/notifications/bulk
// ==========================================

router.post(

    "/bulk",

    protect,

    checkPermission(
        "MANAGE_NOTIFICATIONS"
    ),

    createBulkNotifications

);









// ==========================================
// Get Logged In User Notifications
// GET /api/notifications
// ==========================================

router.get(

    "/",

    protect,

    getNotifications

);









// ==========================================
// Get Unread Notifications
// GET /api/notifications/unread
// ==========================================

router.get(

    "/unread",

    protect,

    getUnreadNotifications

);









// ==========================================
// Mark Single Notification As Read
// PATCH /api/notifications/:id/read
// ==========================================

router.patch(

    "/:id/read",

    protect,

    markAsRead

);









// ==========================================
// Mark All Notifications As Read
// PATCH /api/notifications/read-all
// ==========================================

router.patch(

    "/read-all",

    protect,

    markAllAsRead

);









// ==========================================
// Delete Notification
// DELETE /api/notifications/:id
// ==========================================

router.delete(

    "/:id",

    protect,

    deleteNotification

);







module.exports = router;