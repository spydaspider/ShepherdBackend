const Attendance = require("../models/Attendance");
const Service = require("../models/Service");
const User = require("../models/User");

const getAttendanceReport = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        const allMembers = await User.find({
            isActive: true
        }).select(
            "firstName lastName gender isChild phone"
        );

        const attendance = await Attendance.find({
            service: service._id
        }).populate(
            "user",
            "firstName lastName gender isChild phone"
        );

        const validAttendance = attendance.filter(
            record => record.user
        );

        const presentRecords = validAttendance.filter(
            record => record.status === "Present"
        );

        const excusedRecords = validAttendance.filter(
            record => record.status === "Excused"
        );

        const presentIds = presentRecords.map(
            record => record.user._id.toString()
        );

        const excusedIds = excusedRecords.map(
            record => record.user._id.toString()
        );

        const presentMembers = presentRecords.map(
            record => ({
                id: record.user._id,
                firstName: record.user.firstName,
                lastName: record.user.lastName,
                name:
                    `${record.user.firstName} ${record.user.lastName}`,
                phone: record.user.phone,
                gender: record.user.gender,
                isChild: record.user.isChild,
                attendanceMethod:
                    record.attendanceMethod || "Self",
                status: record.status
            })
        );

        const absentMembers = allMembers
            .filter(member => {
                const memberId =
                    member._id.toString();

                return (
                    !presentIds.includes(memberId) &&
                    !excusedIds.includes(memberId)
                );
            })
            .map(member => ({
                id: member._id,
                firstName: member.firstName,
                lastName: member.lastName,
                name:
                    `${member.firstName} ${member.lastName}`,
                phone: member.phone,
                gender: member.gender,
                isChild: member.isChild,
                status: "Absent"
            }));

        const excusedMembers = excusedRecords.map(
            record => ({
                id: record.user._id,
                firstName: record.user.firstName,
                lastName: record.user.lastName,
                name:
                    `${record.user.firstName} ${record.user.lastName}`,
                phone: record.user.phone,
                gender: record.user.gender,
                isChild: record.user.isChild,
                attendanceMethod:
                    record.attendanceMethod || "Self",
                status: record.status
            })
        );

        const totalMembers = allMembers.length;

        const present = presentMembers.length;

        const absent = absentMembers.length;

        const excused = excusedMembers.length;

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

        const attendanceRate =
            totalMembers > 0
                ? Number(
                      (
                          (present / totalMembers) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return res.status(200).json({
            success: true,

            report: {
                service: {
                    id: service._id,
                    name: service.name,
                    serviceType:
                        service.serviceType,
                    serviceDate:
                        service.serviceDate
                },

                summary: {
                    totalMembers,
                    present,
                    absent,
                    excused,
                    attendanceRate,
                    adults,
                    children,
                    male,
                    female
                },

                presentMembers,

                absentMembers,

                excusedMembers
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

module.exports = {
    getAttendanceReport
};