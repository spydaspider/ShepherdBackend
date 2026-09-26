const FollowUp = require("../models/FollowUp");

const Service = require("../models/Service");


// =====================================================
// CHECK SERVICE ENDED
// =====================================================

const isServiceEnded = (service) => {

    if (!service) {

        return false;

    }


    return (

        service.closed === true ||

        service.closedAt !== null

    );

};


// =====================================================
// GET ENDED SERVICE IDS
// =====================================================

const getEndedServiceIds = async () => {

    const services = await Service.find({

        $or: [

            {
                closed: true
            },

            {
                closedAt: {
                    $ne: null
                }
            }

        ]

    }).select("_id");


    return services.map(
        service => service._id
    );

};


// =====================================================
// GET ALL FOLLOW UPS
// =====================================================

const getFollowUps = async (req, res) => {

    try {

        // ==============================================
        // ONLY ENDED SERVICES
        // ==============================================

        const endedServiceIds =
            await getEndedServiceIds();


        // ==============================================
        // GET FOLLOW UPS
        // ==============================================

        const followUps =
            await FollowUp.find({

                service: {
                    $in: endedServiceIds
                }

            })

            .populate(
                "member",
                "firstName lastName phone email gender"
            )

            .populate(
                "assignedTo",
                "firstName lastName role"
            )

            .populate(
                "service",
                "name serviceType serviceDate startTime endTime closed closedAt"
            )

            .populate(
                "createdBy",
                "firstName lastName role"
            )

            .populate(
                "updatedBy",
                "firstName lastName role"
            )

            .sort({
                createdAt: -1
            });


        // ==============================================
        // RESPONSE
        // ==============================================

        return res.json({

            success: true,

            count: followUps.length,

            followUps

        });

    }

    catch (error) {

        console.error(
            "Get Follow Ups Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// GET SINGLE FOLLOW UP
// =====================================================

const getFollowUp = async (req, res) => {

    try {

        const followUp =
            await FollowUp.findById(
                req.params.id
            )

            .populate(
                "member"
            )

            .populate(
                "assignedTo",
                "firstName lastName role"
            )

            .populate(
                "service"
            )

            .populate(
                "createdBy",
                "firstName lastName role"
            )

            .populate(
                "updatedBy",
                "firstName lastName role"
            );


        // ==============================================
        // NOT FOUND
        // ==============================================

        if (!followUp) {

            return res.status(404).json({

                success: false,

                message: "Follow up not found"

            });

        }


        // ==============================================
        // SERVICE MUST BE ENDED
        // ==============================================

        if (
            !isServiceEnded(
                followUp.service
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Follow ups are only available after the service has ended."

            });

        }


        // ==============================================
        // RESPONSE
        // ==============================================

        return res.json({

            success: true,

            followUp

        });

    }

    catch (error) {

        console.error(
            "Get Follow Up Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// CREATE FOLLOW UP
// =====================================================

const createFollowUp = async (req, res) => {

    try {

        const {

            member,

            assignedTo,

            service,

            type,

            notes,

            followUpDate,

            priority

        } = req.body;


        // ==============================================
        // REQUIRED SERVICE
        // ==============================================

        if (!service) {

            return res.status(400).json({

                success: false,

                message: "Service is required"

            });

        }


        // ==============================================
        // FIND SERVICE
        // ==============================================

        const serviceRecord =
            await Service.findById(
                service
            );


        if (!serviceRecord) {

            return res.status(404).json({

                success: false,

                message: "Service not found"

            });

        }


        // ==============================================
        // SERVICE MUST BE ENDED
        // ==============================================

        if (
            !isServiceEnded(
                serviceRecord
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Follow ups cannot be created until the service has ended."

            });

        }


        // ==============================================
        // CREATE FOLLOW UP
        // ==============================================

        const followUp =
            await FollowUp.create({

                member,

                assignedTo,

                service,

                type,

                notes,

                followUpDate,

                priority,

                createdBy:
                    req.user._id,

                status: "Pending"

            });


        // ==============================================
        // POPULATE RESPONSE
        // ==============================================

        const populatedFollowUp =
            await FollowUp.findById(
                followUp._id
            )

            .populate(
                "member",
                "firstName lastName phone email gender"
            )

            .populate(
                "assignedTo",
                "firstName lastName role"
            )

            .populate(
                "service",
                "name serviceType serviceDate startTime endTime closed closedAt"
            )

            .populate(
                "createdBy",
                "firstName lastName role"
            );


        // ==============================================
        // RESPONSE
        // ==============================================

        return res.status(201).json({

            success: true,

            message:
                "Follow up created successfully",

            followUp:
                populatedFollowUp

        });

    }

    catch (error) {

        console.error(
            "Create Follow Up Error:",
            error
        );


        // ==============================================
        // DUPLICATE FOLLOW UP
        // ==============================================

        if (
            error.code === 11000
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "A follow up already exists for this member and service."

            });

        }


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// UPDATE FOLLOW UP
// =====================================================

const updateFollowUp = async (req, res) => {

    try {

        const followUp =
            await FollowUp.findById(
                req.params.id
            );


        // ==============================================
        // NOT FOUND
        // ==============================================

        if (!followUp) {

            return res.status(404).json({

                success: false,

                message: "Follow up not found"

            });

        }


        // ==============================================
        // CHECK SERVICE
        // ==============================================

        const service =
            await Service.findById(
                followUp.service
            );


        if (!service) {

            return res.status(404).json({

                success: false,

                message: "Associated service not found"

            });

        }


        // ==============================================
        // SERVICE MUST BE ENDED
        // ==============================================

        if (
            !isServiceEnded(
                service
            )
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Follow ups cannot be updated until the service has ended."

            });

        }


        // ==============================================
        // ALLOWED FIELDS
        // ==============================================

        const allowedFields = [

            "assignedTo",

            "type",

            "status",

            "priority",

            "followUpDate",

            "outcome",

            "notes"

        ];


        allowedFields.forEach(
            field => {

                if (
                    req.body[field] !== undefined
                ) {

                    followUp[field] =
                        req.body[field];

                }

            }
        );


        // ==============================================
        // CONTACTED DATE
        // ==============================================

        if (

            req.body.status === "Contacted" &&

            !followUp.contactedDate

        ) {

            followUp.contactedDate =
                new Date();

        }


        // ==============================================
        // COMPLETED DATE
        // ==============================================

        if (
            req.body.status === "Completed"
        ) {

            if (
                !followUp.completedDate
            ) {

                followUp.completedDate =
                    new Date();

            }

        }


        // ==============================================
        // UPDATED BY
        // ==============================================

        followUp.updatedBy =
            req.user._id;


        // ==============================================
        // SAVE
        // ==============================================

        await followUp.save();


        // ==============================================
        // POPULATE
        // ==============================================

        const populatedFollowUp =
            await FollowUp.findById(
                followUp._id
            )

            .populate(
                "member",
                "firstName lastName phone email gender"
            )

            .populate(
                "assignedTo",
                "firstName lastName role"
            )

            .populate(
                "service",
                "name serviceType serviceDate startTime endTime closed closedAt"
            )

            .populate(
                "createdBy",
                "firstName lastName role"
            )

            .populate(
                "updatedBy",
                "firstName lastName role"
            );


        // ==============================================
        // RESPONSE
        // ==============================================

        return res.json({

            success: true,

            message:
                "Follow up updated successfully",

            followUp:
                populatedFollowUp

        });

    }

    catch (error) {

        console.error(
            "Update Follow Up Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// FOLLOW UP STATS
// =====================================================

const getFollowUpStats = async (req, res) => {

    try {

        // ==============================================
        // ENDED SERVICES
        // ==============================================

        const endedServiceIds =
            await getEndedServiceIds();


        // ==============================================
        // BASE QUERY
        // ==============================================

        const baseQuery = {

            service: {
                $in: endedServiceIds
            }

        };


        // ==============================================
        // PENDING
        // ==============================================

        const pending =
            await FollowUp.countDocuments({

                ...baseQuery,

                status: "Pending"

            });


        // ==============================================
        // COMPLETED
        // ==============================================

        const completed =
            await FollowUp.countDocuments({

                ...baseQuery,

                status: "Completed"

            });


        // ==============================================
        // OVERDUE
        // ==============================================

        const overdue =
            await FollowUp.countDocuments({

                ...baseQuery,

                status: "Pending",

                followUpDate: {

                    $lt: new Date()

                }

            });


        // ==============================================
        // RESPONSE
        // ==============================================

        return res.json({

            success: true,

            stats: {

                pending,

                completed,

                overdue

            }

        });

    }

    catch (error) {

        console.error(
            "Follow Up Stats Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getFollowUps,

    getFollowUp,

    createFollowUp,

    updateFollowUp,

    getFollowUpStats

};