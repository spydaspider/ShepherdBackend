const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Service = require("../models/Service");


// =====================================================
// Generate Membership Number
// =====================================================

const generateMembershipNumber = async () => {

    let exists = true;
    let number;

    while (exists) {

        const year = new Date().getFullYear();

        const random =
            Math.floor(
                10000 + Math.random() * 90000
            );

        number = `CH-${year}-${random}`;

        const member = await User.findOne({
            membershipNumber: number
        });

        if (!member) {
            exists = false;
        }
    }

    return number;
};


// =====================================================
// Generate Family ID
// =====================================================

const generateFamilyId = async () => {

    let exists = true;
    let familyId;

    while (exists) {

        const year = new Date().getFullYear();

        const random =
            Math.floor(
                1000 + Math.random() * 9000
            );

        familyId = `FAM-${year}-${random}`;

        const family = await User.findOne({
            familyId
        });

        if (!family) {
            exists = false;
        }
    }

    return familyId;
};


// =====================================================
// GET ALL MEMBERS
// GET /api/members
// =====================================================

const getMembers = async (req, res) => {

    try {

        const {
            search,
            gender,
            membershipType,
            status,
            role,
            isChild,
            page = 1,
            limit = 20
        } = req.query;


        const pageNumber =
            Math.max(
                Number(page) || 1,
                1
            );


        const limitNumber =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );


        const filter = {
            deleted: false
        };


        // =================================================
        // FILTERS
        // =================================================

        if (gender) {
            filter.gender = gender;
        }


        if (membershipType) {
            filter.membershipType =
                membershipType;
        }


        if (status) {
            filter.status = status;
        }


        if (role) {
            filter.role = role;
        }


        if (isChild !== undefined) {

            filter.isChild =
                isChild === "true";

        }


        // =================================================
        // SEARCH
        // =================================================

        if (search && search.trim()) {

            const searchValue =
                search.trim();

            filter.$or = [

                {
                    firstName: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    lastName: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    phone: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    email: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    membershipNumber: {
                        $regex: searchValue,
                        $options: "i"
                    }
                },

                {
                    familyId: {
                        $regex: searchValue,
                        $options: "i"
                    }
                }

            ];
        }


        // =================================================
        // PAGINATION
        // =================================================

        const skip =
            (pageNumber - 1) *
            limitNumber;


        // =================================================
        // GET MEMBERS
        // =================================================

        const [
            members,
            total
        ] = await Promise.all([

            User.find(filter)

                .populate(
                    "parent",
                    "firstName lastName phone membershipNumber"
                )

                .populate(
                    "children",
                    "firstName lastName gender dateOfBirth membershipNumber"
                )

                .sort({
                    createdAt: -1
                })

                .skip(skip)

                .limit(limitNumber),

            User.countDocuments(filter)

        ]);


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            page: pageNumber,

            limit: limitNumber,

            pages:
                Math.ceil(
                    total / limitNumber
                ),

            total,

            count:
                members.length,

            members

        });

    }
    catch (error) {

        console.error(
            "Get members error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// GET SINGLE MEMBER
// GET /api/members/:id
// =====================================================

const getMemberById = async (req, res) => {

    try {

        const member =
            await User.findOne({

                _id: req.params.id,

                deleted: false

            })

            .populate(
                "parent",
                "firstName lastName phone membershipNumber"
            )

            .populate(
                "children",
                "firstName lastName gender dateOfBirth membershipNumber"
            );


        if (!member) {

            return res.status(404).json({

                success: false,

                message: "Member not found"

            });

        }


        // =================================================
        // ATTENDANCE HISTORY
        // =================================================

        const attendance =
            await Attendance.find({

                user: member._id

            })

            .populate(
                "service",
                "name serviceDate serviceType startTime endTime"
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
        // ATTENDANCE STATISTICS
        // =================================================

        const attended =
            attendance.filter(
                record =>
                    record.status === "Present"
            ).length;


        const absent =
            attendance.filter(
                record =>
                    record.status === "Absent"
            ).length;


        const excused =
            attendance.filter(
                record =>
                    record.status === "Excused"
            ).length;


        const totalServices =
            attendance.length;


        const rate =
            totalServices > 0

                ? Number(
                    (
                        attended /
                        totalServices *
                        100
                    ).toFixed(2)
                )

                : 0;


        // =================================================
        // LAST ATTENDANCE
        // =================================================

        const lastAttendance =
            attendance.find(
                record =>
                    record.status === "Present"
            ) || null;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            member,

            summary: {

                totalServices,

                attended,

                absent,

                excused,

                rate

            },

            lastAttendance,

            history: attendance

        });

    }
    catch (error) {

        console.error(
            "Get member error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// GET CURRENT MEMBER DASHBOARD
// GET /api/members/me/dashboard
// =====================================================

const getMyDashboard = async (req, res) => {

    try {

        const userId =
            req.user._id;


        // =================================================
        // GET CURRENT MEMBER
        // =================================================

        const member =
            await User.findOne({

                _id: userId,

                deleted: false

            })

            .select(`
                firstName
                lastName
                email
                phone
                gender
                dateOfBirth
                membershipNumber
                membershipType
                role
                isChild
                totalAttendance
                lastAttendance
                familyId
                status
                isActive
            `)

            .populate(
                "children",
                `
                firstName
                lastName
                gender
                dateOfBirth
                membershipNumber
                status
                `
            );


        if (!member) {

            return res.status(404).json({

                success: false,

                message: "Member not found"

            });

        }


        // =================================================
        // ACTIVE SERVICE
        // =================================================

        const activeService =
            await Service.findOne({

                status: "Active",

                attendanceOpen: true

            })

            .sort({

                serviceDate: -1,

                createdAt: -1

            });


        // =================================================
        // GET MEMBER ATTENDANCE
        // =================================================

        const attendance =
            await Attendance.find({

                user: userId

            })

            .populate(
                "service",
                `
                name
                serviceType
                serviceDate
                startTime
                endTime
                status
                attendanceOpen
                `
            )

            .sort({

                attendanceDate: -1,

                createdAt: -1

            });


        // =================================================
        // TOTAL ATTENDANCE
        // =================================================

        const totalAttendance =
            attendance.filter(
                record =>
                    record.status === "Present"
            ).length;


        // =================================================
        // CURRENT MONTH
        // =================================================

        const now =
            new Date();


        const startOfMonth =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
                0,
                0,
                0,
                0
            );


        const startOfNextMonth =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1,
                0,
                0,
                0,
                0
            );


        // =================================================
        // MEMBER ATTENDANCE THIS MONTH
        // =================================================

        const monthlyAttendance =
            attendance.filter(record => {

                if (
                    record.status !==
                    "Present"
                ) {
                    return false;
                }


                const attendanceDate =
                    new Date(
                        record.attendanceDate
                    );


                return (

                    attendanceDate >=
                    startOfMonth &&

                    attendanceDate <
                    startOfNextMonth

                );

            }).length;


        // =================================================
        // SERVICES THIS MONTH
        // =================================================

        const monthlyServices =
            await Service.countDocuments({

                serviceDate: {

                    $gte: startOfMonth,

                    $lt: startOfNextMonth

                },

                status: {
                    $in: [
                        "Active",
                        "Completed",
                        "Closed"
                    ]
                }

            });


        // =================================================
        // MONTHLY ATTENDANCE RATE
        // =================================================

        const monthlyAttendanceRate =
            monthlyServices > 0

                ? Number(
                    (
                        monthlyAttendance /
                        monthlyServices *
                        100
                    ).toFixed(2)
                )

                : 0;


        // =================================================
        // TODAY / ACTIVE SERVICE
        // =================================================

        let todayAttended = false;

        let todayAttendance = null;


        if (activeService) {

            todayAttendance =
                await Attendance.findOne({

                    user: userId,

                    service:
                        activeService._id

                })

                .populate(
                    "service",
                    `
                    name
                    serviceType
                    serviceDate
                    startTime
                    endTime
                    status
                    attendanceOpen
                    `
                );


            todayAttended =
                Boolean(

                    todayAttendance &&

                    todayAttendance.status ===
                    "Present"

                );

        }


        // =================================================
        // LAST ATTENDANCE
        // =================================================

        const lastAttendance =
            attendance.find(
                record =>
                    record.status === "Present"
            ) || null;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,


            // =================================================
            // MEMBER
            // =================================================

            member: {

                id:
                    member._id,

                firstName:
                    member.firstName,

                lastName:
                    member.lastName,

                email:
                    member.email,

                phone:
                    member.phone,

                gender:
                    member.gender,

                membershipNumber:
                    member.membershipNumber,

                membershipType:
                    member.membershipType,

                role:
                    member.role,

                isChild:
                    member.isChild,

                familyId:
                    member.familyId,

                status:
                    member.status,

                dateOfBirth: 
                member.dateOfBirth,

                isActive:
                    member.isActive,

                children:
                    member.children || []

            },


            // =================================================
            // ACTIVE SERVICE
            // =================================================

            activeService:

                activeService

                    ? {

                        id:
                            activeService._id,

                        name:
                            activeService.name,

                        serviceType:
                            activeService.serviceType,

                        serviceDate:
                            activeService.serviceDate,

                        startTime:
                            activeService.startTime,

                        endTime:
                            activeService.endTime,

                        status:
                            activeService.status,

                        attendanceOpen:
                            activeService.attendanceOpen

                    }

                    : null,


            // =================================================
            // TODAY
            // =================================================

            today: {

                attended:
                    todayAttended,

                attendance:
                    todayAttendance

            },


            // =================================================
            // ATTENDANCE
            // =================================================

            attendance: {

                total:
                    totalAttendance,

                thisMonth:
                    monthlyAttendance,

                thisMonthServices:
                    monthlyServices,

                thisMonthRate:
                    monthlyAttendanceRate,

                lastAttendance:
                    lastAttendance

            }

        });

    }
    catch (error) {

        console.error(
            "Get member dashboard error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// GET AVAILABLE PARENTS
// GET /api/members/parents
// =====================================================

const getParents = async (req, res) => {

    try {

        const parents =
            await User.find({

                deleted: false,

                isChild: false,

                status: "Active",

                role: {
                    $in: [
                        "Member",
                        "Leader",
                        "Pastor"
                    ]
                }

            })

            .select(
                `
                firstName
                lastName
                phone
                membershipNumber
                familyId
                role
                `
            )

            .sort({

                firstName: 1,

                lastName: 1

            });


        res.json({

            success: true,

            parents

        });

    }
    catch (error) {

        console.error(
            "Get parents error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// CREATE MEMBER WITH CHILDREN
// POST /api/members
// =====================================================

const createMember = async (req, res) => {

    try {

        const data =
            req.body;


        const {

            firstName,

            lastName,

            email,

            phone,

            gender,

            children = [],

            hasAccount = false,

            password

        } = data;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !firstName ||
            !lastName ||
            !gender
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "First name, last name and gender are required"

            });

        }


        if (
            hasAccount &&
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password required when creating account"

            });

        }


        if (
            children &&
            !Array.isArray(children)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Children must be an array"

            });

        }


        // =================================================
        // CHECK EMAIL
        // =================================================

        if (email) {

            const exists =
                await User.findOne({

                    email

                });


            if (exists) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email already exists"

                });

            }

        }


        // =================================================
        // CHECK PHONE
        // =================================================

        if (phone) {

            const exists =
                await User.findOne({

                    phone

                });


            if (exists) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone already exists"

                });

            }

        }


        // =================================================
        // GENERATE IDENTIFIERS
        // =================================================

        const membershipNumber =
            await generateMembershipNumber();


        const familyId =
            await generateFamilyId();


        // =================================================
        // CREATE PARENT
        // =================================================

        const parent =
            await User.create({

                ...data,

                children: [],

                familyId,

                membershipNumber,

                isChild: false,

                parent: null,

                guardian: null,

                role:
                    data.role ||
                    "Member",

                hasAccount:
                    Boolean(hasAccount),

                loginEnabled:
                    Boolean(hasAccount),

                mustChangePassword:
                    Boolean(hasAccount),

                accountCreatedAt:
                    hasAccount
                        ? new Date()
                        : null,

                accountCreatedBy:
                    hasAccount
                        ? req.user?._id
                        : null,

                registrationSource:
                    "Admin",

                createdBy:
                    req.user?._id ||
                    null

            });


        // =================================================
        // CREATE CHILDREN
        // =================================================

        const createdChildren = [];


        for (
            const child of children
        ) {

            if (
                !child.firstName ||
                !child.gender
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Each child must have a first name and gender"

                });

            }


            const childMember =
                await User.create({

                    firstName:
                        child.firstName,

                    lastName:
                        child.lastName ||
                        lastName,

                    gender:
                        child.gender,

                    dateOfBirth:
                        child.dateOfBirth ||
                        null,

                    isChild: true,

                    parent:
                        parent._id,

                    guardian:
                        parent._id,

                    role:
                        "Child",

                    membershipType:
                        "Member",

                    status:
                        "Active",

                    isActive:
                        true,

                    registrationSource:
                        "Parent",

                    createdBy:
                        req.user?._id ||
                        null

                });


            createdChildren.push(
                childMember._id
            );

        }


        // =================================================
        // UPDATE PARENT CHILDREN
        // =================================================

        if (
            createdChildren.length > 0
        ) {

            parent.children =
                createdChildren;

            await parent.save();

        }


        // =================================================
        // GET CREATED MEMBER
        // =================================================

        const result =
            await User.findById(
                parent._id
            )

            .populate(
                "children",
                `
                firstName
                lastName
                gender
                dateOfBirth
                membershipNumber
                `
            );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Member and children created successfully",

            familyId,

            member: result

        });

    }
    catch (error) {

        console.error(
            "Create member error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// UPDATE MEMBER
// PATCH /api/members/:id
// =====================================================

const updateMember = async (req, res) => {

    try {

        const member =
            await User.findOne({

                _id: req.params.id,

                deleted: false

            });


        if (!member) {

            return res.status(404).json({

                success: false,

                message:
                    "Member not found"

            });

        }


        // =================================================
        // PROTECTED FIELDS
        // =================================================

        const protectedFields = [

            "_id",

            "membershipNumber",

            "familyId",

            "isChild",

            "parent",

            "guardian",

            "children",

            "totalAttendance",

            "lastAttendance",

            "createdAt",

            "updatedAt",

            "createdBy",

            "updatedBy",

            "deleted"

        ];


        Object.keys(req.body).forEach(
            field => {

                if (
                    !protectedFields.includes(field) &&
                    field !== "password"
                ) {

                    member[field] =
                        req.body[field];

                }

            }
        );


        member.updatedBy =
            req.user?._id ||
            null;


        await member.save();


        res.json({

            success: true,

            message:
                "Member updated successfully",

            member

        });

    }
    catch (error) {

        console.error(
            "Update member error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// CHANGE MEMBER STATUS
// PATCH /api/members/:id/status
// =====================================================

const changeMemberStatus = async (
    req,
    res
) => {

    try {

        const {
            status
        } = req.body;


        const allowedStatuses = [

            "Active",

            "Inactive",

            "Suspended"

        ];


        if (!status) {

            return res.status(400).json({

                success: false,

                message:
                    "Status is required"

            });

        }


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`

            });

        }


        const member =
            await User.findOne({

                _id: req.params.id,

                deleted: false

            });


        if (!member) {

            return res.status(404).json({

                success: false,

                message:
                    "Member not found"

            });

        }


        member.status =
            status;


        member.isActive =
            status === "Active";


        member.updatedBy =
            req.user?._id ||
            null;


        await member.save();


        res.json({

            success: true,

            message:
                "Member status updated",

            member

        });

    }
    catch (error) {

        console.error(
            "Change member status error:",
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

    getMembers,

    getMemberById,

    getMyDashboard,

    createMember,

    updateMember,

    changeMemberStatus,

    getParents

};