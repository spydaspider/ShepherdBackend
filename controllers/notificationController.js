const Notification = require("../models/Notification");


// ==========================================
// Create Notification
// POST /api/notifications
// ==========================================

const createNotification = async (req, res) => {

    try {

        const {
            recipient,
            title,
            message,
            type,
            priority,
            relatedId,
            relatedModel,
            actionUrl
        } = req.body;


        // ------------------------------------------
        // Validate Required Fields
        // ------------------------------------------

        if (
            !recipient ||
            !title ||
            !message
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Recipient, title and message are required"

            });

        }


        // ------------------------------------------
        // Create Notification
        // ------------------------------------------

        const notification =
            await Notification.create({

                recipient,

                // Always use the logged-in user
                // as the sender
                sender:
                    req.user?._id || null,

                title,

                message,

                type:
                    type || "System",

                priority:
                    priority || "Normal",

                relatedId:
                    relatedId || null,

                relatedModel:
                    relatedModel || null,

                actionUrl:
                    actionUrl || ""

            });


        return res.status(201).json({

            success: true,

            message:
                "Notification created successfully",

            notification

        });

    }
    catch (error) {

        console.log(
            "CREATE NOTIFICATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Create Multiple Notifications
// POST /api/notifications/bulk
//
// Used for:
// - Service announcements
// - Follow-up assignments
// - Church alerts
// ==========================================

const createBulkNotifications = async (req, res) => {

    try {

        const notifications =
            req.body.notifications;


        // ------------------------------------------
        // Validate Notifications
        // ------------------------------------------

        if (
            !Array.isArray(notifications) ||
            notifications.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Notifications array required"

            });

        }


        // ------------------------------------------
        // Add Defaults
        // ------------------------------------------

        const notificationsWithDefaults =
            notifications.map(notification => ({

                recipient:
                    notification.recipient,

                title:
                    notification.title,

                message:
                    notification.message,

                type:
                    notification.type ||
                    "System",

                priority:
                    notification.priority ||
                    "Normal",

                relatedId:
                    notification.relatedId ||
                    null,

                relatedModel:
                    notification.relatedModel ||
                    null,

                actionUrl:
                    notification.actionUrl ||
                    "",

                // Always use the logged-in user
                // as sender
                sender:
                    req.user?._id || null

            }));


        // ------------------------------------------
        // Create Notifications
        // ------------------------------------------

        const created =
            await Notification.insertMany(
                notificationsWithDefaults
            );


        return res.status(201).json({

            success: true,

            message:
                "Notifications created successfully",

            count:
                created.length,

            notifications:
                created

        });

    }
    catch (error) {

        console.log(
            "CREATE BULK NOTIFICATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Get My Notifications
// GET /api/notifications
// ==========================================

const getNotifications = async (req, res) => {

    try {

        // ------------------------------------------
        // Pagination
        // ------------------------------------------

        const page =
            Math.max(
                Number(req.query.page) || 1,
                1
            );


        const limit =
            Math.min(
                Math.max(
                    Number(req.query.limit) || 20,
                    1
                ),
                100
            );


        const skip =
            (page - 1) * limit;


        // ------------------------------------------
        // Fetch Notifications
        // ------------------------------------------

        const [
            notifications,
            total,
            unreadCount
        ] = await Promise.all([

            Notification.find({

                recipient:
                    req.user._id

            })
                .populate(
                    "sender",
                    "firstName lastName"
                )
                .sort({

                    createdAt: -1

                })
                .skip(skip)
                .limit(limit),


            // Total notifications

            Notification.countDocuments({

                recipient:
                    req.user._id

            }),


            // Unread notifications

            Notification.countDocuments({

                recipient:
                    req.user._id,

                isRead: false

            })

        ]);


        return res.json({

            success: true,

            page,

            limit,

            total,

            unreadCount,

            notifications

        });

    }
    catch (error) {

        console.log(
            "GET NOTIFICATIONS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Get Unread Notifications
// GET /api/notifications/unread
// ==========================================

const getUnreadNotifications = async (req, res) => {

    try {

        const notifications =
            await Notification.find({

                recipient:
                    req.user._id,

                isRead: false

            })
                .populate(
                    "sender",
                    "firstName lastName"
                )
                .sort({

                    createdAt: -1

                });


        return res.json({

            success: true,

            count:
                notifications.length,

            notifications

        });

    }
    catch (error) {

        console.log(
            "GET UNREAD NOTIFICATIONS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Mark Notification As Read
// PATCH /api/notifications/:id/read
// ==========================================

const markAsRead = async (req, res) => {

    try {

        const notification =
            await Notification.findOne({

                _id:
                    req.params.id,

                recipient:
                    req.user._id

            });


        // ------------------------------------------
        // Notification Not Found
        // ------------------------------------------

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found"

            });

        }


        // ------------------------------------------
        // Already Read
        // ------------------------------------------

        if (notification.isRead) {

            return res.json({

                success: true,

                message:
                    "Already marked as read",

                notification

            });

        }


        // ------------------------------------------
        // Mark As Read
        // ------------------------------------------

        notification.isRead = true;

        notification.readAt =
            new Date();


        await notification.save();


        return res.json({

            success: true,

            message:
                "Notification marked as read",

            notification

        });

    }
    catch (error) {

        console.log(
            "MARK NOTIFICATION READ ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Mark All As Read
// PATCH /api/notifications/read-all
// ==========================================

const markAllAsRead = async (req, res) => {

    try {

        await Notification.updateMany(

            {

                recipient:
                    req.user._id,

                isRead: false

            },

            {

                isRead: true,

                readAt:
                    new Date()

            }

        );


        return res.json({

            success: true,

            message:
                "All notifications marked as read"

        });

    }
    catch (error) {

        console.log(
            "MARK ALL NOTIFICATIONS READ ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Delete Notification
// DELETE /api/notifications/:id
// ==========================================

const deleteNotification = async (req, res) => {

    try {

        const notification =
            await Notification.findOne({

                _id:
                    req.params.id,

                recipient:
                    req.user._id

            });


        // ------------------------------------------
        // Notification Not Found
        // ------------------------------------------

        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found"

            });

        }


        // ------------------------------------------
        // Delete
        // ------------------------------------------

        await notification.deleteOne();


        return res.json({

            success: true,

            message:
                "Notification deleted successfully"

        });

    }
    catch (error) {

        console.log(
            "DELETE NOTIFICATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Export Controllers
// ==========================================

module.exports = {

    createNotification,

    createBulkNotifications,

    getNotifications,

    getUnreadNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification

};