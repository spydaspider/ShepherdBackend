const User = require("../models/User");


// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

const getUsers = async (req, res) => {

    try {

        const users = await User.find({
            deleted: false
        })
            .select("-password")
            .sort({
                createdAt: -1
            });


        return res.status(200).json({

            success: true,

            count: users.length,

            users

        });

    }
    catch (error) {

        console.error(
            "GET USERS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// GET FAMILY
// GET /api/users/family
//
// Returns the logged-in parent and their children.
// =====================================================

const getFamily = async (req, res) => {

    try {

        const parent = await User.findOne({

            _id: req.user._id,

            deleted: false

        })
            .select("-password")
            .populate({

                path: "children",

                select: `
                    firstName
                    lastName
                    gender
                    dateOfBirth
                    membershipNumber
                    status
                    isActive
                    isChild
                    parent
                    guardian
                    familyId
                    totalAttendance
                    attendancePercentage
                    lastAttendance
                `

            });


        if (!parent) {

            return res.status(404).json({

                success: false,

                message: "User not found"

            });

        }


        return res.status(200).json({

            success: true,

            family: {

                parent: {

                    _id: parent._id,

                    firstName:
                        parent.firstName,

                    lastName:
                        parent.lastName,

                    email:
                        parent.email,

                    phone:
                        parent.phone,

                    gender:
                        parent.gender,

                    membershipNumber:
                        parent.membershipNumber,

                    familyId:
                        parent.familyId,

                    role:
                        parent.role

                },

                children:
                    parent.children || []

            }

        });

    }
    catch (error) {

        console.error(
            "GET FAMILY ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// ADD CHILD
// POST /api/users/family/children
//
// The logged-in user becomes the child's parent/guardian.
// =====================================================

const addChild = async (req, res) => {

    try {

        const {

            firstName,

            lastName,

            gender,

            dateOfBirth

        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !firstName ||
            !gender
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "First name and gender are required"

            });

        }


        // =================================================
        // FIND PARENT
        // =================================================

        const parent = await User.findOne({

            _id: req.user._id,

            deleted: false,

            isChild: false

        });


        if (!parent) {

            return res.status(404).json({

                success: false,

                message:
                    "Parent account not found"

            });

        }


        // =================================================
        // CREATE CHILD
        // =================================================

        const child = await User.create({

            firstName:
                firstName.trim(),

            lastName:
                lastName
                    ? lastName.trim()
                    : parent.lastName,

            gender,

            dateOfBirth:
                dateOfBirth || null,

            isChild: true,

            parent:
                parent._id,

            guardian:
                parent._id,

            familyId:
                parent.familyId,

            role: "Child",

            membershipType: "Member",

            status: "Active",

            isActive: true,

            hasAccount: false,

            loginEnabled: false,

            registrationSource: "Parent",

            createdBy:
                parent._id

        });


        // =================================================
        // ADD CHILD TO PARENT
        // =================================================

        parent.children =
            parent.children || [];


        parent.children.push(
            child._id
        );


        parent.updatedBy =
            parent._id;


        await parent.save();


        // =================================================
        // RETURN CREATED CHILD
        // =================================================

        const createdChild =
            await User.findById(
                child._id
            )
                .select("-password");


        return res.status(201).json({

            success: true,

            message:
                "Child added successfully",

            child:
                createdChild

        });

    }
    catch (error) {

        console.error(
            "ADD CHILD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// UPDATE CHILD
// PATCH /api/users/family/children/:childId
//
// Parent can only update their own child.
// =====================================================

const updateChild = async (req, res) => {

    try {

        const parent =
            await User.findOne({

                _id: req.user._id,

                deleted: false,

                isChild: false

            });


        if (!parent) {

            return res.status(404).json({

                success: false,

                message:
                    "Parent account not found"

            });

        }


        // =================================================
        // VERIFY CHILD BELONGS TO PARENT
        // =================================================

        const child =
            await User.findOne({

                _id:
                    req.params.childId,

                parent:
                    parent._id,

                isChild: true,

                deleted: false

            });


        if (!child) {

            return res.status(404).json({

                success: false,

                message:
                    "Child not found in your family"

            });

        }


        // =================================================
        // ALLOWED FIELDS
        // =================================================

        const allowedFields = [

            "firstName",

            "lastName",

            "gender",

            "dateOfBirth"

        ];


        allowedFields.forEach(
            field => {

                if (
                    req.body[field] !==
                    undefined
                ) {

                    child[field] =
                        req.body[field];

                }

            }
        );


        child.updatedBy =
            parent._id;


        await child.save();


        return res.status(200).json({

            success: true,

            message:
                "Child updated successfully",

            child

        });

    }
    catch (error) {

        console.error(
            "UPDATE CHILD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// REMOVE CHILD
// PATCH /api/users/family/children/:childId/remove
//
// We do NOT physically delete the child.
// The child is marked inactive instead.
//
// This protects existing attendance/history.
// =====================================================

const removeChild = async (req, res) => {

    try {

        const parent =
            await User.findOne({

                _id: req.user._id,

                deleted: false,

                isChild: false

            });


        if (!parent) {

            return res.status(404).json({

                success: false,

                message:
                    "Parent account not found"

            });

        }


        // =================================================
        // FIND CHILD
        // =================================================

        const child =
            await User.findOne({

                _id:
                    req.params.childId,

                parent:
                    parent._id,

                isChild: true,

                deleted: false

            });


        if (!child) {

            return res.status(404).json({

                success: false,

                message:
                    "Child not found in your family"

            });

        }


        // =================================================
        // DEACTIVATE CHILD
        // =================================================

        child.status =
            "Inactive";

        child.isActive =
            false;

        child.updatedBy =
            parent._id;


        await child.save();


        // =================================================
        // REMOVE CHILD FROM PARENT'S CHILDREN ARRAY
        // =================================================

        parent.children =
            (parent.children || [])
                .filter(

                    childId =>
                        childId.toString() !==
                        child._id.toString()

                );


        parent.updatedBy =
            parent._id;


        await parent.save();


        return res.status(200).json({

            success: true,

            message:
                "Child removed successfully"

        });

    }
    catch (error) {

        console.error(
            "REMOVE CHILD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getUsers,

    getFamily,

    addChild,

    updateChild,

    removeChild

};