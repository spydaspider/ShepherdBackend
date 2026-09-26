const Service = require("../models/Service");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");

const generateFollowUps = require("../utils/generateFollowUps");



// ==========================================
// Generate Attendance Code
// ==========================================

const generateAttendanceCode = () => {

    return Math.floor(
        1000 + Math.random() * 9000
    ).toString();

};



// ==========================================
// Generate Unique Code
// ==========================================

const generateUniqueCode = async () => {

    let code;

    let exists = true;

    while (exists) {

        code = generateAttendanceCode();

        const service =
            await Service.findOne({
                attendanceCode: code
            });

        if (!service) {

            exists = false;

        }

    }

    return code;

};



// ==========================================
// Update Attendance Summary
// ==========================================

const updateAttendanceSummary = async (serviceId) => {

    const service =
        await Service.findById(serviceId);

    if (!service) {

        return;

    }


    const totalMembers =
        await User.countDocuments({

            isActive: true

        });


    const attendance =
        await Attendance.find({

            service: serviceId,

            status: "Present"

        })
            .populate("user");


    const users =
        attendance
            .map(item => item.user)
            .filter(Boolean);


    service.attendanceSummary = {

        totalPresent:
            users.length,

        totalAbsent:
            Math.max(
                totalMembers - users.length,
                0
            ),

        adultsPresent:
            users.filter(
                user => !user.isChild
            ).length,

        childrenPresent:
            users.filter(
                user => user.isChild
            ).length,

        malePresent:
            users.filter(
                user => user.gender === "Male"
            ).length,

        femalePresent:
            users.filter(
                user => user.gender === "Female"
            ).length,

        attendanceRate:
            totalMembers > 0
                ?
                Number(
                    (
                        users.length /
                        totalMembers *
                        100
                    ).toFixed(2)
                )
                :
                0

    };


    await service.save();

};



// ==========================================
// Notify All Active Members
// ==========================================

const notifyAllActiveMembers = async ({
    title,
    message,
    type = "Service",
    priority = "Normal",
    relatedId = null,
    relatedModel = null,
    actionUrl = "",
    sender = null
}) => {

    try {

        const members =
            await User.find({

                isActive: true

            })
                .select("_id");


        if (!members.length) {

            return 0;

        }


        const notifications =
            members.map(member => ({

                recipient:
                    member._id,

                sender:
                    sender || null,

                title,

                message,

                type,

                priority,

                relatedId,

                relatedModel,

                actionUrl

            }));


        await Notification.insertMany(
            notifications
        );


        return notifications.length;

    }
    catch (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );


        // Notification failure should never
        // prevent the main service operation.

        return 0;

    }

};



// ==========================================
// Create Service
// POST /api/services
// ==========================================

const createService = async (req, res) => {

    try {

        const {
            name,
            serviceType,
            serviceDate,
            startTime,
            endTime,
            description
        } = req.body;


        // ------------------------------------------
        // Validate Required Fields
        // ------------------------------------------

        if (
            !name ||
            !serviceType ||
            !serviceDate
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, service type and date are required"

            });

        }


        // ------------------------------------------
        // Check Duplicate Service
        // ------------------------------------------

        const start =
            new Date(serviceDate);


        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date(serviceDate);


        end.setHours(
            23,
            59,
            59,
            999
        );


        const existing =
            await Service.findOne({

                serviceType,

                serviceDate: {
                    $gte: start,
                    $lte: end
                }

            });


        if (existing) {

            return res.status(400).json({

                success: false,

                message:
                    "Service already exists for this date"

            });

        }


        // ------------------------------------------
        // Close Previous Active Service
        // ------------------------------------------

        await Service.updateMany(

            {

                status: "Active",

                attendanceOpen: true

            },

            {

                status: "Completed",

                attendanceOpen: false,

                closedAt: new Date()

            }

        );


        // ------------------------------------------
        // Generate Attendance Code
        // ------------------------------------------

        const attendanceCode =
            await generateUniqueCode();


        // ------------------------------------------
        // Attendance Code Expiry
        // ------------------------------------------

        const expiry =
            new Date(serviceDate);


        expiry.setHours(
            23,
            59,
            59,
            999
        );


        // ------------------------------------------
        // Create Service
        // ------------------------------------------

        const service =
            await Service.create({

                name,

                serviceType,

                serviceDate,

                startTime,

                endTime,

                description:
                    description || "",

                attendanceCode,

                codeExpiresAt:
                    expiry,

                status:
                    "Active",

                attendanceOpen:
                    true,

                generatedBy:
                    req.user._id

            });


        // ==========================================
        // Notify All Active Members
        // ==========================================

        const notificationsSent =
            await notifyAllActiveMembers({

                title:
                    "New Service Created",

                message:
                    `${name} has been scheduled for ${new Date(serviceDate).toDateString()}.`,

                type:
                    "Service",

                priority:
                    "Normal",

                relatedId:
                    service._id,

                relatedModel:
                    "Service",

                actionUrl:
                    `/services/${service._id}`,

                sender:
                    req.user?._id || null

            });


        // ------------------------------------------
        // Response
        // ------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Service created successfully",

            notificationsSent,

            service

        });

    }
    catch (error) {

        console.log(
            "CREATE SERVICE ERROR:",
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
// Get Active Service
// GET /api/services/active
// ==========================================

const getActiveService = async (req, res) => {

    try {

        const service =
            await Service.findOne({

                status: "Active",

                attendanceOpen: true

            });


        if (!service) {

            return res.status(404).json({

                success: false,

                message:
                    "No active service found"

            });

        }


        // ------------------------------------------
        // Expire Attendance Code
        // ------------------------------------------

        if (
            service.codeExpiresAt &&
            new Date() > service.codeExpiresAt
        ) {

            service.status =
                "Completed";

            service.attendanceOpen =
                false;

            service.closedAt =
                new Date();


            await service.save();


            return res.status(400).json({

                success: false,

                message:
                    "Attendance code expired"

            });

        }


        return res.json({

            success: true,

            service

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// End Service
// PATCH /api/services/:id/end
// ==========================================

const endService = async (req, res) => {

    try {

        const service =
            await Service.findById(
                req.params.id
            );


        if (!service) {

            return res.status(404).json({

                success: false,

                message:
                    "Service not found"

            });

        }


        if (
            service.status === "Completed"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Service already completed"

            });

        }


        // ------------------------------------------
        // Update Attendance Summary
        // ------------------------------------------

        await updateAttendanceSummary(
            service._id
        );


        // ------------------------------------------
        // Generate Follow Ups
        // ------------------------------------------

        const followUps =
            await generateFollowUps(
                service._id,
                req.user._id
            );


        // ------------------------------------------
        // Complete Service
        // ------------------------------------------

        service.status =
            "Completed";

        service.attendanceOpen =
            false;

        service.closedAt =
            new Date();


        await service.save();


        // ==========================================
        // Notify All Active Members
        // ==========================================

        const notificationsSent =
            await notifyAllActiveMembers({

                title:
                    "Service Completed",

                message:
                    `${service.name} has been completed. Thank you for attending.`,

                type:
                    "Service",

                priority:
                    "Normal",

                relatedId:
                    service._id,

                relatedModel:
                    "Service",

                actionUrl:
                    `/services/${service._id}`,

                sender:
                    req.user?._id || null

            });


        // ------------------------------------------
        // Response
        // ------------------------------------------

        return res.json({

            success: true,

            message:
                "Service completed successfully",

            followUpsCreated:
                followUps.length,

            notificationsSent,

            service

        });

    }
    catch (error) {

        console.log(
            "END SERVICE ERROR:",
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
// Get All Services
// GET /api/services
// ==========================================

const getServices = async (req, res) => {

    try {

        const services =
            await Service.find()

                .populate(
                    "generatedBy",
                    "firstName lastName"
                )

                .sort({

                    serviceDate: -1

                });


        return res.json({

            success: true,

            count:
                services.length,

            services

        });

    }
    catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};



// ==========================================
// Get Service By ID
// GET /api/services/:id
// ==========================================

const getServiceById = async (req, res) => {

    try {

        let service =
            await Service.findById(
                req.params.id
            )
                .populate(
                    "generatedBy",
                    "firstName lastName"
                );


        if (!service) {

            return res.status(404).json({

                success: false,

                message:
                    "Service not found"

            });

        }


        // ------------------------------------------
        // Update Summary For Active Service
        // ------------------------------------------

        if (
            service.status === "Active"
        ) {

            await updateAttendanceSummary(
                service._id
            );


            // Fetch fresh service

            service =
                await Service.findById(
                    req.params.id
                )
                    .populate(
                        "generatedBy",
                        "firstName lastName"
                    );

        }


        // ------------------------------------------
        // Get Attendance
        // ------------------------------------------

        const attendance =
            await Attendance.find({

                service:
                    service._id

            })
                .populate(

                    "user",

                    "firstName lastName gender isChild membershipNumber"

                )
                .sort({

                    createdAt: -1

                });


        // ------------------------------------------
        // Response
        // ------------------------------------------

        return res.json({

            success: true,

            service,

            attendanceSummary:
                service.attendanceSummary,

            attendanceCount:
                attendance.length,

            attendance

        });

    }
    catch (error) {

        console.log(
            "GET SERVICE ERROR:",
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
// Export
// ==========================================

module.exports = {

    createService,

    getActiveService,

    endService,

    getServices,

    getServiceById

};