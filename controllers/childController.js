const User = require("../models/User");


// =====================================
// Add Child
// POST /api/users/children
// =====================================

const addChild = async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            gender,
            dateOfBirth,
            school,
            schoolClass
        } = req.body;

        // Logged-in parent
        const parent = req.user;

        // Create child
        const child = await User.create({

            firstName,
            lastName: parent.lastName,
            gender,
            dateOfBirth,

            school,
            schoolClass,

            isChild: true,
            role: "Child",

            parent: parent._id,
            createdBy: parent._id,

            familyId: parent.familyId
        });

        // Add child to parent's children array
        await User.findByIdAndUpdate(
            parent._id,
            {
                $push: {
                    children: child._id
                }
            }
        );

        res.status(201).json({
            success: true,
            message: "Child added successfully",
            child
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =====================================
// Get My Children
// GET /api/users/children
// =====================================

const getChildren = async (req, res) => {

    try {

        const children = await User.find({

            parent: req.user._id,
            isChild: true

        }).sort({
            firstName: 1
        });

        res.json({

            success: true,

            count: children.length,

            children

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


// =====================================
// Get One Child
// GET /api/users/children/:id
// =====================================

const getChild = async (req, res) => {

    try {

        const child = await User.findOne({

            _id: req.params.id,
            parent: req.user._id,
            isChild: true

        });

        if (!child) {

            return res.status(404).json({

                success: false,
                message: "Child not found"

            });

        }

        res.json({

            success: true,

            child

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


// =====================================
// Update Child
// PUT /api/users/children/:id
// =====================================

const updateChild = async (req, res) => {

    try {

        const child = await User.findOne({

            _id: req.params.id,
            parent: req.user._id,
            isChild: true

        });

        if (!child) {

            return res.status(404).json({

                success: false,
                message: "Child not found"

            });

        }

        Object.assign(child, req.body);

        await child.save();

        res.json({

            success: true,
            message: "Child updated successfully",
            child

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


// =====================================
// Delete Child
// DELETE /api/users/children/:id
// =====================================

const deleteChild = async (req, res) => {

    try {

        const child = await User.findOne({

            _id: req.params.id,
            parent: req.user._id,
            isChild: true

        });

        if (!child) {

            return res.status(404).json({

                success: false,
                message: "Child not found"

            });

        }

        // Remove child from parent's list
        await User.findByIdAndUpdate(

            req.user._id,

            {
                $pull: {
                    children: child._id
                }
            }

        );

        await child.deleteOne();

        res.json({

            success: true,
            message: "Child deleted successfully"

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};


module.exports = {

    addChild,
    getChildren,
    getChild,
    updateChild,
    deleteChild

};