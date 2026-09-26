const Attendance = require("../models/Attendance");
const Service = require("../models/Service");
const User = require("../models/User");


// =====================================================
// Get Child Attendance History
// GET /api/attendance/child/:childId
// =====================================================

const getChildAttendanceHistory = async (req, res) => {

    try {

        const { childId } = req.params;


        // =================================================
        // VALIDATE CHILD ID
        // =================================================

        if (!childId) {

            return res.status(400).json({
                success: false,
                message: "Child ID is required."
            });

        }


        // =================================================
        // FIND CHILD
        // =================================================

        const child = await User.findOne({
            _id: childId,
            isChild: true
        });


        if (!child) {

            return res.status(404).json({
                success: false,
                message: "Child not found."
            });

        }


        // =================================================
        // VERIFY PARENT
        // =================================================

        if (
            !child.parent ||
            String(child.parent) !==
            String(req.user._id)
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this child's attendance."
            });

        }


        // =================================================
        // GET ATTENDANCE
        // =================================================

        const attendance = await Attendance.find({

            user: child._id,

            isDeleted: false

        })

            .populate(
                "service",
                "name serviceType serviceDate startTime endTime"
            )

            .populate(
                "markedBy",
                "firstName lastName"
            )

            .sort({
                attendanceDate: -1,
                createdAt: -1
            });


        // =================================================
        // CALCULATE SUMMARY
        // =================================================

        const total = attendance.length;

        const present = attendance.filter(
            item => item.status === "Present"
        ).length;

        const absent = attendance.filter(
            item => item.status === "Absent"
        ).length;

        const excused = attendance.filter(
            item => item.status === "Excused"
        ).length;


        const attendanceRate =
            total > 0
                ? Number(
                    (
                        present /
                        total *
                        100
                    ).toFixed(2)
                )
                : 0;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            child: {

                _id: child._id,

                firstName: child.firstName,

                lastName: child.lastName,

                gender: child.gender,

                dateOfBirth: child.dateOfBirth,

                membershipNumber:
                    child.membershipNumber

            },

            summary: {

                total,

                present,

                absent,

                excused,

                attendanceRate

            },

            attendance

        });

    }

    catch (error) {

        console.error(
            "Get child attendance history error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Get My Attendance History
// GET /api/attendance/my-history
// =====================================================

const getMyAttendanceHistory = async (req, res) => {

    try {

        const attendance = await Attendance.find({

            user: req.user._id,

            isDeleted: false

        })

            .populate(
                "service",
                "name serviceType serviceDate startTime endTime"
            )

            .sort({
                attendanceDate: -1,
                createdAt: -1
            });


        // =================================================
        // CALCULATE SUMMARY
        // =================================================

        const total = attendance.length;

        const present = attendance.filter(
            item => item.status === "Present"
        ).length;

        const absent = attendance.filter(
            item => item.status === "Absent"
        ).length;

        const excused = attendance.filter(
            item => item.status === "Excused"
        ).length;


        const attendanceRate =
            total > 0
                ? Number(
                    (
                        present /
                        total *
                        100
                    ).toFixed(2)
                )
                : 0;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            summary: {

                total,

                present,

                absent,

                excused,

                attendanceRate

            },

            attendance

        });

    }

    catch (error) {

        console.error(
            "Get member attendance history error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Update Attendance Summary
// =====================================================
//
// This function updates the summary stored on the
// Service document.
//
// IMPORTANT:
// Male and Female now mean ADULT males/females only.
// Children are counted separately.
//
// Male Adults
// + Female Adults
// + Children
// = Total Present
// =====================================================

const updateAttendanceSummary = async (serviceId) => {

    const service =
        await Service.findById(serviceId);


    if (!service) {
        return;
    }


    // =================================================
    // COUNT ACTIVE MEMBERS
    // =================================================

    const totalMembers =
        await User.countDocuments({

            isActive: true,

            deleted: false

        });


    // =================================================
    // GET PRESENT ATTENDANCE
    // =================================================

    const records =
        await Attendance.find({

            service: serviceId,

            status: "Present",

            isDeleted: false

        }).populate(
            "user",
            "gender isChild isActive deleted"
        );


    // =================================================
    // ONLY COUNT VALID USERS
    // =================================================

    const users = records

        .map(record => record.user)

        .filter(user =>

            user &&

            user.isActive !== false &&

            user.deleted !== true

        );


    // =================================================
    // TOTAL PRESENT
    // =================================================

    const totalPresent =
        users.length;


    // =================================================
    // CHILDREN
    // =================================================

    const childrenPresent =
        users.filter(
            user => user.isChild === true
        ).length;


    // =================================================
    // ADULT MALES
    // =================================================

    const malePresent =
        users.filter(
            user =>
                user.isChild !== true &&
                user.gender === "Male"
        ).length;


    // =================================================
    // ADULT FEMALES
    // =================================================

    const femalePresent =
        users.filter(
            user =>
                user.isChild !== true &&
                user.gender === "Female"
        ).length;


    // =================================================
    // ADULTS
    // =================================================

    const adultsPresent =
        malePresent +
        femalePresent;


    // =================================================
    // ABSENT
    // =================================================

    const totalAbsent =
        Math.max(
            totalMembers -
            totalPresent,
            0
        );


    // =================================================
    // ATTENDANCE RATE
    // =================================================

    const attendanceRate =
        totalMembers > 0

            ? Number(
                (
                    totalPresent /
                    totalMembers *
                    100
                ).toFixed(2)
            )

            : 0;


    // =================================================
    // SAVE SUMMARY
    // =================================================

    service.attendanceSummary = {

        totalPresent,

        totalAbsent,

        adultsPresent,

        childrenPresent,

        malePresent,

        femalePresent,

        attendanceRate

    };


    await service.save();

};



// =====================================================
// Update User Attendance Statistics
// =====================================================

const updateUserAttendance = async (userId) => {

    const user =
        await User.findById(userId);


    if (!user) {
        return;
    }


    // =================================================
    // TOTAL PRESENT
    // =================================================

    user.totalAttendance =
        await Attendance.countDocuments({

            user: userId,

            status: "Present",

            isDeleted: false

        });


    // =================================================
    // FIND MOST RECENT ATTENDANCE
    // =================================================

    const latestAttendance =
        await Attendance.findOne({

            user: userId,

            status: "Present",

            isDeleted: false

        })

            .sort({
                attendanceDate: -1,
                createdAt: -1
            });


    if (latestAttendance) {

        user.lastAttendance =
            latestAttendance.attendanceDate;

        user.lastServiceAttended =
            latestAttendance.service;

    }


    await user.save();

};



// =====================================================
// Member / Parent Mark Attendance
// POST /api/attendance/mark
// =====================================================

const markAttendance = async (req, res) => {

    try {

        const {
            code,
            members = []
        } = req.body;


        // =================================================
        // FIND ACTIVE SERVICE
        // =================================================

        const service =
            await Service.findOne({

                attendanceCode: code,

                status: "Active",

                attendanceOpen: true

            });


        if (!service) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid or expired attendance code"

            });

        }


        // =================================================
        // BUILD SELECTED MEMBERS
        // =================================================

        let selectedMembers =
            [...members];


        // Always include logged-in user

        if (
            !selectedMembers.includes(
                req.user._id.toString()
            )
        ) {

            selectedMembers.push(
                req.user._id.toString()
            );

        }


        // =================================================
        // FIND ALLOWED MEMBERS
        // =================================================

        const allowedMembers =
            await User.find({

                _id: {
                    $in: selectedMembers
                },

                deleted: false,

                $or: [

                    {
                        _id: req.user._id
                    },

                    {
                        parent: req.user._id
                    }

                ]

            });


        if (
            allowedMembers.length !==
            selectedMembers.length
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You can only mark yourself and your children"

            });

        }


        // =================================================
        // CREATE ATTENDANCE
        // =================================================

        let created = [];

        let alreadyPresent = [];


        for (
            const member of allowedMembers
        ) {

            const existing =
                await Attendance.findOne({

                    user: member._id,

                    service: service._id

                });


            if (existing) {

                if (
                    existing.status === "Present" &&
                    existing.isDeleted === false
                ) {

                    alreadyPresent.push(member);

                    continue;

                }


                // Restore previously deleted/absent record

                existing.status = "Present";

                existing.isDeleted = false;

                existing.attendanceMethod =
                    member._id.toString() ===
                    req.user._id.toString()

                        ? "Self"

                        : "Parent";

                existing.markedBy =
                    req.user._id;

                existing.attendanceDate =
                    new Date();

                existing.checkedInAt =
                    new Date();

                await existing.save();

                created.push(existing);

                await updateUserAttendance(
                    member._id
                );

                continue;

            }


            const attendance =
                await Attendance.create({

                    user: member._id,

                    service: service._id,

                    status: "Present",

                    attendanceMethod:

                        member._id.toString() ===
                        req.user._id.toString()

                            ? "Self"

                            : "Parent",

                    markedBy:
                        req.user._id,

                    attendanceDate:
                        new Date(),

                    checkedInAt:
                        new Date()

                });


            created.push(attendance);


            await updateUserAttendance(
                member._id
            );

        }


        // =================================================
        // UPDATE SERVICE SUMMARY
        // =================================================

        await updateAttendanceSummary(
            service._id
        );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Attendance marked successfully",

            created:
                created.length,

            alreadyPresent:
                alreadyPresent.length

        });

    }

    catch (error) {

        console.error(
            "Mark attendance error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Admin Mark Attendance
// POST /api/attendance/admin-mark
// =====================================================

const adminMarkAttendance = async (
    req,
    res
) => {

    try {

        const {
            serviceId,
            members = []
        } = req.body;


        // =================================================
        // FIND ACTIVE SERVICE
        // =================================================

        const service =
            await Service.findOne({

                _id: serviceId,

                status: "Active",

                attendanceOpen: true

            });


        if (!service) {

            return res.status(404).json({

                success: false,

                message:
                    "Active service not found"

            });

        }


        // =================================================
        // CREATE ATTENDANCE
        // =================================================

        let created = [];

        let alreadyPresent = [];


        for (
            const memberId of members
        ) {

            const member =
                await User.findOne({

                    _id: memberId,

                    deleted: false

                });


            if (!member) {
                continue;
            }


            const existing =
                await Attendance.findOne({

                    user: member._id,

                    service: service._id

                });


            if (existing) {

                if (
                    existing.status === "Present" &&
                    existing.isDeleted === false
                ) {

                    alreadyPresent.push(member);

                    continue;

                }


                existing.status = "Present";

                existing.isDeleted = false;

                existing.attendanceMethod =
                    "Admin";

                existing.markedBy =
                    req.user._id;

                existing.attendanceDate =
                    new Date();

                existing.checkedInAt =
                    new Date();

                await existing.save();

                created.push(existing);

                await updateUserAttendance(
                    member._id
                );

                continue;

            }


            const attendance =
                await Attendance.create({

                    user: member._id,

                    service: service._id,

                    status: "Present",

                    attendanceMethod:
                        "Admin",

                    markedBy:
                        req.user._id,

                    attendanceDate:
                        new Date(),

                    checkedInAt:
                        new Date()

                });


            created.push(attendance);


            await updateUserAttendance(
                member._id
            );

        }


        // =================================================
        // UPDATE SERVICE SUMMARY
        // =================================================

        await updateAttendanceSummary(
            service._id
        );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Admin attendance recorded",

            created:
                created.length,

            alreadyPresent:
                alreadyPresent.length

        });

    }

    catch (error) {

        console.error(
            "Admin mark attendance error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Get Service Attendance Report
// GET /api/attendance/service/:serviceId
// =====================================================

const getServiceAttendance = async (
    req,
    res
) => {

    try {

        const service =
            await Service.findById(
                req.params.serviceId
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


        // =================================================
        // GET ATTENDANCE
        // =================================================

        const attendance =
            await Attendance.find({

                service: service._id,

                isDeleted: false

            })

            .populate(
                "user",
                "firstName lastName gender phone isChild membershipNumber"
            )

            .populate(
                "markedBy",
                "firstName lastName"
            )

            .sort({
                createdAt: -1
            });


        // =================================================
        // PRESENT USERS
        // =================================================

        const present =
            attendance.filter(
                item =>
                    item.status === "Present"
            );


        const users =
            present

                .map(item => item.user)

                .filter(Boolean);


        // =================================================
        // ACTIVE MEMBERS
        // =================================================

        const totalMembers =
            await User.countDocuments({

                isActive: true,

                deleted: false

            });


        // =================================================
        // SUMMARY
        // =================================================

        const maleAdults =
            users.filter(
                user =>
                    user.isChild !== true &&
                    user.gender === "Male"
            ).length;


        const femaleAdults =
            users.filter(
                user =>
                    user.isChild !== true &&
                    user.gender === "Female"
            ).length;


        const children =
            users.filter(
                user =>
                    user.isChild === true
            ).length;


        const adults =
            maleAdults +
            femaleAdults;


        const totalPresent =
            maleAdults +
            femaleAdults +
            children;


        const totalAbsent =
            Math.max(
                totalMembers -
                totalPresent,
                0
            );


        const attendanceRate =
            totalMembers > 0

                ? Number(
                    (
                        totalPresent /
                        totalMembers *
                        100
                    ).toFixed(2)
                )

                : 0;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            service: {

                id: service._id,

                name: service.name,

                serviceType:
                    service.serviceType,

                date:
                    service.serviceDate,

                startTime:
                    service.startTime,

                endTime:
                    service.endTime,

                status:
                    service.status,

                generatedBy:
                    service.generatedBy

            },

            summary: {

                totalPresent,

                totalAbsent,

                maleAdults,

                femaleAdults,

                children,

                adults,

                attendanceRate

            },

            attendanceCount:
                attendance.length,

            attendance

        });

    }

    catch (error) {

        console.error(
            "Get service attendance error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Secretary Attendance Report
// GET /api/attendance/secretary-report/:serviceId
// =====================================================
//
// This is the simplified report intended for the
// church Secretary.
//
// Categories are mutually exclusive:
//
// Male Adults
// Female Adults
// Children
// Total Present
// =====================================================

const getSecretaryAttendanceReport = async (
    req,
    res
) => {

    try {

        const { serviceId } =
            req.params;


        // =================================================
        // VALIDATE SERVICE ID
        // =================================================

        if (!serviceId) {

            return res.status(400).json({

                success: false,

                message:
                    "Service ID is required"

            });

        }


        // =================================================
        // FIND SERVICE
        // =================================================

        const service =
            await Service.findById(
                serviceId
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


        // =================================================
        // GET PRESENT ATTENDANCE
        // =================================================

        const attendance =
            await Attendance.find({

                service: service._id,

                status: "Present",

                isDeleted: false

            })

            .populate(
                "user",
                "firstName lastName gender isChild"
            );


        // =================================================
        // VALID USERS
        // =================================================

        const users =
            attendance

                .map(record => record.user)

                .filter(user =>

                    user &&

                    user.isChild !== undefined

                );


        // =================================================
        // COUNT CHILDREN
        // =================================================

        const children =
            users.filter(
                user =>
                    user.isChild === true
            ).length;


        // =================================================
        // COUNT MALE ADULTS
        // =================================================

        const maleAdults =
            users.filter(
                user =>
                    user.isChild !== true &&
                    user.gender === "Male"
            ).length;


        // =================================================
        // COUNT FEMALE ADULTS
        // =================================================

        const femaleAdults =
            users.filter(
                user =>
                    user.isChild !== true &&
                    user.gender === "Female"
            ).length;


        // =================================================
        // TOTAL PRESENT
        // =================================================

        const totalPresent =
            maleAdults +
            femaleAdults +
            children;


        // =================================================
        // TOTAL ACTIVE MEMBERS
        // =================================================

        const totalMembers =
            await User.countDocuments({

                isActive: true,

                deleted: false

            });


        // =================================================
        // ABSENT
        // =================================================

        const totalAbsent =
            Math.max(
                totalMembers -
                totalPresent,
                0
            );


        // =================================================
        // ATTENDANCE RATE
        // =================================================

        const attendanceRate =
            totalMembers > 0

                ? Number(
                    (
                        totalPresent /
                        totalMembers *
                        100
                    ).toFixed(2)
                )

                : 0;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            report: {

                service: {

                    id: service._id,

                    name:
                        service.name,

                    serviceType:
                        service.serviceType,

                    date:
                        service.serviceDate,

                    startTime:
                        service.startTime,

                    endTime:
                        service.endTime,

                    status:
                        service.status,

                    generatedBy:
                        service.generatedBy

                },

                attendance: {

                    maleAdults,

                    femaleAdults,

                    children,

                    totalPresent,

                    totalAbsent,

                    totalMembers,

                    attendanceRate

                }

            }

        });

    }

    catch (error) {

        console.error(
            "Secretary attendance report error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Update Attendance Status
// PATCH /api/attendance/:id
// =====================================================

const updateAttendanceStatus = async (
    req,
    res
) => {

    try {

        const attendance =
            await Attendance.findById(
                req.params.id
            );


        if (!attendance) {

            return res.status(404).json({

                success: false,

                message:
                    "Attendance record not found"

            });

        }


        // =================================================
        // VALIDATE STATUS
        // =================================================

        const allowedStatuses = [

            "Present",
            "Absent",
            "Excused"

        ];


        if (
            !allowedStatuses.includes(
                req.body.status
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid attendance status"

            });

        }


        attendance.status =
            req.body.status;

        attendance.markedBy =
            req.user._id;

        attendance.isDeleted = false;


        await attendance.save();


        // =================================================
        // UPDATE USER STATISTICS
        // =================================================

        await updateUserAttendance(
            attendance.user
        );


        // =================================================
        // UPDATE SERVICE SUMMARY
        // =================================================

        await updateAttendanceSummary(
            attendance.service
        );


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            message:
                "Attendance updated successfully",

            attendance

        });

    }

    catch (error) {

        console.error(
            "Update attendance status error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// Attendance Dashboard
// GET /api/attendance/dashboard
// =====================================================

const getAttendanceDashboard = async (
    req,
    res
) => {

    try {

        // =================================================
        // TOTAL ACTIVE MEMBERS
        // =================================================

        const totalMembers =
            await User.countDocuments({

                isActive: true,

                deleted: false

            });


        // =================================================
        // ACTIVE SERVICE
        // =================================================

        const activeService =
            await Service.findOne({

                status: "Active"

            });


        let overview = {

            totalMembers,

            presentToday: 0,

            absentToday:
                totalMembers,

            attendanceRate: 0,

            men: 0,

            women: 0,

            children: 0

        };


        // =================================================
        // TODAY'S ATTENDANCE
        // =================================================

        if (activeService) {

            const attendance =
                await Attendance.find({

                    service:
                        activeService._id,

                    status: "Present",

                    isDeleted: false

                })

                .populate(
                    "user",
                    "gender isChild"
                );


            const presentToday =
                attendance.length;


            overview = {

                totalMembers,

                presentToday,

                absentToday:
                    Math.max(
                        totalMembers -
                        presentToday,
                        0
                    ),

                attendanceRate:

                    totalMembers > 0

                        ? Number(
                            (
                                presentToday /
                                totalMembers *
                                100
                            ).toFixed(2)
                        )

                        : 0,


                men:
                    attendance.filter(
                        item =>
                            item.user?.gender ===
                                "Male" &&
                            item.user?.isChild !== true
                    ).length,


                women:
                    attendance.filter(
                        item =>
                            item.user?.gender ===
                                "Female" &&
                            item.user?.isChild !== true
                    ).length,


                children:
                    attendance.filter(
                        item =>
                            item.user?.isChild === true
                    ).length

            };

        }


        // =================================================
        // RECENT SERVICES
        // =================================================

        const recentServices =
            await Service.find()

                .sort({
                    serviceDate: -1
                })

                .limit(10);


        const services =
            recentServices.map(
                service => ({

                    _id:
                        service._id,

                    name:
                        service.name,

                    date:
                        service.serviceDate,

                    type:
                        service.serviceType,

                    status:
                        service.status,

                    summary:
                        service.attendanceSummary ||
                        {}

                })
            );


        // =================================================
        // ATTENDANCE TREND
        // =================================================

        const attendanceTrend =
            recentServices

                .slice()

                .reverse()

                .map(
                    service => ({

                        name:
                            service.name,

                        date:
                            service.serviceDate,

                        attendance:
                            service
                                .attendanceSummary
                                ?.totalPresent ||
                            0

                    })
                );


        // =================================================
        // RECENT ATTENDANCE
        // =================================================

        const recentAttendance =
            await Attendance.find({

                isDeleted: false

            })

                .populate(
                    "user",
                    "firstName lastName"
                )

                .sort({
                    checkedInAt: -1
                })

                .limit(10);


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            overview,

            activeService,

            recentServices:
                services,

            recentAttendance,

            attendanceTrend

        });

    }

    catch (error) {

        console.error(
            "Attendance dashboard error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    markAttendance,

    adminMarkAttendance,

    getServiceAttendance,

    getSecretaryAttendanceReport,

    getAttendanceDashboard,

    updateAttendanceStatus,

    getMyAttendanceHistory,

    getChildAttendanceHistory,

    updateAttendanceSummary

};