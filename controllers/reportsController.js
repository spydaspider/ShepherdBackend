const Service = require("../models/Service");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const FollowUp = require("../models/FollowUp");

const getAttendanceReport = async (req, res) => {
    try {
        const service = await Service.findById(req.params.serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        const members = await User.find({
            isActive: true
        }).select(
            "firstName lastName gender isChild phone"
        );

        const attendance = await Attendance.find({
            service: service._id
        })
            .populate(
                "user",
                "firstName lastName gender isChild phone"
            );

        const validAttendance = attendance.filter(
            record => record.user
        );

        const presentRecords = validAttendance.filter(
            record => record.status === "Present"
        );

        const presentIds = presentRecords.map(
            record => record.user._id.toString()
        );

        const presentMembers = presentRecords.map(
            record => ({
                id: record.user._id,
                name: `${record.user.firstName} ${record.user.lastName}`,
                firstName: record.user.firstName,
                lastName: record.user.lastName,
                phone: record.user.phone,
                gender: record.user.gender,
                isChild: record.user.isChild,
                attendanceMethod: record.attendanceMethod,
                status: record.status
            })
        );

        const absentMembers = members
            .filter(member => {
                return !presentIds.includes(
                    member._id.toString()
                );
            })
            .map(member => ({
                id: member._id,
                name: `${member.firstName} ${member.lastName}`,
                firstName: member.firstName,
                lastName: member.lastName,
                phone: member.phone,
                gender: member.gender,
                isChild: member.isChild,
                status: "Absent"
            }));

        const totalMembers = members.length;
        const present = presentMembers.length;
        const absent = absentMembers.length;

        const adults = presentMembers.filter(
            member => !member.isChild
        ).length;

        const children = presentMembers.filter(
            member => member.isChild
        ).length;

        const male = presentMembers.filter(
            member => member.gender === "Male"
        ).length;

        const female = presentMembers.filter(
            member => member.gender === "Female"
        ).length;

        const rate = totalMembers > 0
            ? Number(
                (
                    (present / totalMembers) * 100
                ).toFixed(2)
            )
            : 0;

        return res.status(200).json({
            success: true,

            report: {
                service: {
                    id: service._id,
                    name: service.name,
                    serviceType: service.serviceType,
                    serviceDate: service.serviceDate
                },

                summary: {
                    totalMembers,
                    present,
                    absent,
                    rate,
                    attendanceRate: rate,
                    adults,
                    children,
                    male,
                    female
                },

                presentMembers,
                absentMembers
            }
        });

    } catch (error) {
        console.error(
            "GET ATTENDANCE REPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getServiceReports = async (req, res) => {
    try {
        const services = await Service.find()
            .sort({
                serviceDate: -1
            })
            .select(
                "name serviceType serviceDate attendanceSummary"
            );

        let totalRate = 0;

        let highestAttendance = null;
        let lowestAttendance = null;

        const formattedServices = services.map(
            service => {
                const summary =
                    service.attendanceSummary || {};

                const present =
                    summary.totalPresent || 0;

                const absent =
                    summary.totalAbsent || 0;

                const rate =
                    summary.attendanceRate || 0;

                totalRate += rate;

                if (
                    !highestAttendance ||
                    present >
                    highestAttendance.attendance
                ) {
                    highestAttendance = {
                        service: service.name,
                        date: service.serviceDate,
                        attendance: present
                    };
                }

                if (
                    !lowestAttendance ||
                    present <
                    lowestAttendance.attendance
                ) {
                    lowestAttendance = {
                        service: service.name,
                        date: service.serviceDate,
                        attendance: present
                    };
                }

                return {
                    id: service._id,
                    name: service.name,
                    serviceType: service.serviceType,
                    date: service.serviceDate,

                    attendance: {
                        present,
                        absent,
                        rate
                    }
                };
            }
        );

        const averageAttendanceRate =
            services.length > 0
                ? Number(
                    (
                        totalRate /
                        services.length
                    ).toFixed(2)
                )
                : 0;

        return res.status(200).json({
            success: true,

            summary: {
                totalServices: services.length,
                averageAttendanceRate,
                highestAttendance,
                lowestAttendance
            },

            services: formattedServices
        });

    } catch (error) {
        console.error(
            "GET SERVICE REPORTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getMemberAttendanceReport = async (req, res) => {

    try {

        const member = await User.findById(
            req.params.memberId
        );

        if (!member) {

            return res.status(404).json({
                success: false,
                message: "Member not found"
            });

        }

        const attendance = await Attendance.find({
            user: member._id
        })
            .populate(
                "service",
                "name serviceDate serviceType"
            );

        const validAttendance = attendance
            .filter(record => record.service)
            .sort((a, b) => {

                return new Date(
                    b.service.serviceDate
                ) - new Date(
                    a.service.serviceDate
                );

            });

        const totalServices = await Service.countDocuments();

        const attended = validAttendance.filter(
            record => record.status === "Present"
        ).length;

        const absent = Math.max(
            totalServices - attended,
            0
        );

        const rate = totalServices > 0
            ? Number(
                (
                    (attended / totalServices) * 100
                ).toFixed(2)
            )
            : 0;

        const lastAttendance =
            validAttendance.length > 0
                ? validAttendance.find(
                    record =>
                        record.status === "Present"
                )?.service || null
                : null;

        return res.json({

            success: true,

            member: {

                id: member._id,

                name:
                    `${member.firstName} ${member.lastName}`,

                phone:
                    member.phone,

                membershipType:
                    member.membershipType,

                joinedChurchDate:
                    member.joinedChurchDate

            },

            summary: {

                totalServices,

                attended,

                absent,

                rate

            },

            lastAttendance,

            history: validAttendance

        });

    } catch (error) {

        console.error(
            "Member attendance report error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const getFollowUpReport = async (req, res) => {
    try {
        const pending =
            await FollowUp.countDocuments({
                status: "Pending"
            });

        const contacted =
            await FollowUp.countDocuments({
                status: "Contacted"
            });

        const completed =
            await FollowUp.countDocuments({
                status: "Completed"
            });

        const unable =
            await FollowUp.countDocuments({
                status: "Unable To Reach"
            });

        const recentFollowUps =
            await FollowUp.find()
                .populate(
                    "member",
                    "firstName lastName phone"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName"
                )
                .sort({
                    createdAt: -1
                })
                .limit(10);

        return res.status(200).json({
            success: true,

            summary: {
                pending,
                contacted,
                completed,
                unable
            },

            recentFollowUps
        });

    } catch (error) {
        console.error(
            "GET FOLLOW UP REPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getAttendanceReport,
    getServiceReports,
    getMemberAttendanceReport,
    getFollowUpReport
};