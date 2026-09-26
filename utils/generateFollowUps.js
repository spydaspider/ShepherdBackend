const User = require("../models/User");
const Attendance = require("../models/Attendance");
const FollowUp = require("../models/FollowUp");
const Notification = require("../models/Notification");



// =====================================================
// Generate Follow Ups After Service Completion
// =====================================================

const generateFollowUps = async (serviceId, createdBy) => {

    try {

        // ==========================================
        // Get Active Members
        // ==========================================

        const members = await User.find({

            isActive: true,

            deleted: false,

            role: {
                $in: [
                    "Member",
                    "Child"
                ]
            }

        });


        // ==========================================
        // Get Present Members
        // ==========================================

        const attendance =
            await Attendance.find({

                service: serviceId,

                status: "Present",

                isDeleted: false

            });


        const attendedIds =
            attendance.map(
                record =>
                    record.user.toString()
            );


        // ==========================================
        // Find Absentees
        // ==========================================

        const absentees =
            members.filter(member =>

                !attendedIds.includes(
                    member._id.toString()
                )

            );


        // ==========================================
        // No Absentees
        // ==========================================

        if (absentees.length === 0) {

            return [];

        }


        // ==========================================
        // Get Leaders
        // ==========================================

        const leaders =
            await User.find({

                role: {
                    $in: [
                        "Leader",
                        "Pastor",
                        "Admin"
                    ]
                },

                isActive: true

            });


        // ==========================================
        // No Leaders
        // ==========================================

        if (leaders.length === 0) {

            return [];

        }


        let followUps = [];

        let notificationData = [];

        let leaderIndex = 0;


        // ==========================================
        // Create Follow Ups
        // ==========================================

        for (const absentee of absentees) {

            let memberToFollow = absentee;


            // ------------------------------------------
            // If Child, Follow Up Parent
            // ------------------------------------------

            if (
                absentee.isChild &&
                absentee.parent
            ) {

                const parent =
                    await User.findById(
                        absentee.parent
                    );


                if (parent) {

                    memberToFollow =
                        parent;

                }

            }


            // ------------------------------------------
            // Check Duplicate
            // ------------------------------------------

            const exists =
                await FollowUp.findOne({

                    member:
                        memberToFollow._id,

                    service:
                        serviceId

                });


            if (exists) {

                continue;

            }


            // ------------------------------------------
            // Assign Leader
            // ------------------------------------------

            const assignedLeader =
                leaders[
                    leaderIndex %
                    leaders.length
                ];

            leaderIndex++;


            // ------------------------------------------
            // Prepare Follow Up
            // ------------------------------------------

            const followUp = {

                member:
                    memberToFollow._id,

                service:
                    serviceId,

                assignedTo:
                    assignedLeader._id,

                type:
                    "Phone Call",

                status:
                    "Pending",

                priority:
                    "Medium",

                followUpDate:
                    new Date(
                        Date.now() +
                        24 * 60 * 60 * 1000
                    ),

                createdBy:
                    createdBy ||
                    assignedLeader._id

            };


            followUps.push(
                followUp
            );


            // ------------------------------------------
            // Prepare Notification Data
            // ------------------------------------------

            notificationData.push({

                recipient:
                    assignedLeader._id,

                title:
                    "New Follow Up Assigned",

                message:
                    `${memberToFollow.firstName || ""} ${memberToFollow.lastName || ""} missed the service and requires follow up`.trim(),

                type:
                    "FollowUp",

                priority:
                    "Normal"

            });

        }


        // ==========================================
        // Nothing New To Create
        // ==========================================

        if (followUps.length === 0) {

            return [];

        }


        // ==========================================
        // Save Follow Ups
        // ==========================================

        const createdFollowUps =
            await FollowUp.insertMany(
                followUps
            );


        // ==========================================
        // Create Notifications
        // ==========================================

        const notifications =
            createdFollowUps.map(
                (followUp, index) => ({

                    recipient:
                        notificationData[index].recipient,

                    sender:
                        createdBy ||
                        notificationData[index].recipient,

                    title:
                        notificationData[index].title,

                    message:
                        notificationData[index].message,

                    type:
                        notificationData[index].type,

                    priority:
                        notificationData[index].priority,

                    // Connect notification to Follow Up
                    relatedId:
                        followUp._id,

                    relatedModel:
                        "FollowUp",

                    // Frontend navigation
                    actionUrl:
                        `/followups/${followUp._id}`

                })
            );


        // ==========================================
        // Save Notifications
        // ==========================================

        if (notifications.length) {

            await Notification.insertMany(
                notifications
            );

        }


        // ==========================================
        // Return Created Follow Ups
        // ==========================================

        return createdFollowUps;

    }
    catch (error) {

        console.log(
            "GENERATE FOLLOW UPS ERROR:",
            error
        );

        throw error;

    }

};



module.exports =
    generateFollowUps;