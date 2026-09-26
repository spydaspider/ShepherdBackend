const permissions = {

    // =====================================================
    // ADMIN
    // =====================================================

    Admin: [

        // Users
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",

        "VIEW_MEMBERS",
        "VIEW_PROFILE",

        // Services
        "CREATE_SERVICE",
        "END_SERVICE",
        "VIEW_SERVICES",

        // Attendance
        "MARK_ATTENDANCE",
        "VIEW_ATTENDANCE",
        "VIEW_ATTENDANCE_REPORT",

        // Dashboard
        "VIEW_DASHBOARD",
        "VIEW_REPORTS",

        // Follow Ups
        "VIEW_FOLLOWUPS",
        "MANAGE_FOLLOWUPS",

        // Management
        "MANAGE_DEPARTMENTS",
        "MANAGE_NOTIFICATIONS"

    ],


    // =====================================================
    // PASTOR
    // =====================================================

    Pastor: [

        // Users
        "CREATE_USER",
        "UPDATE_USER",

        "VIEW_MEMBERS",
        "VIEW_PROFILE",

        // Services
        "CREATE_SERVICE",
        "END_SERVICE",
        "VIEW_SERVICES",

        // Attendance
        "MARK_ATTENDANCE",
        "VIEW_ATTENDANCE",
        "VIEW_ATTENDANCE_REPORT",

        // Dashboard
        "VIEW_DASHBOARD",
        "VIEW_REPORTS",

        // Follow Ups
        "VIEW_FOLLOWUPS",
        "MANAGE_FOLLOWUPS",

        // Notifications
        "MANAGE_NOTIFICATIONS"

    ],


    // =====================================================
    // SECRETARY
    // =====================================================

    Secretary: [

        // Users
        "VIEW_MEMBERS",
        "VIEW_PROFILE",

        // Services
        "VIEW_SERVICES",

        // Attendance
        "VIEW_ATTENDANCE",
        "VIEW_ATTENDANCE_REPORT",

        // Dashboard
        "VIEW_DASHBOARD",
        "VIEW_REPORTS",

        // Follow Ups
        "VIEW_FOLLOWUPS",
        "MANAGE_FOLLOWUPS"

    ],


    // =====================================================
    // LEADER
    // =====================================================

    Leader: [

        // Users
        "CREATE_USER",
        "UPDATE_USER",

        "VIEW_MEMBERS",
        "VIEW_PROFILE",

        // Services
        "VIEW_SERVICES",

        // Attendance
        "MARK_ATTENDANCE",
        "VIEW_ATTENDANCE",
        "VIEW_ATTENDANCE_REPORT",

        // Dashboard
        "VIEW_DASHBOARD",
        "VIEW_REPORTS",

        // Follow Ups
        "VIEW_FOLLOWUPS",
        "MANAGE_FOLLOWUPS"

    ],


    // =====================================================
    // MEMBER
    // =====================================================

    Member: [

        "VIEW_PROFILE",

        "MARK_ATTENDANCE"

    ],


    // =====================================================
    // CHILD
    // =====================================================

    Child: [

        "VIEW_PROFILE",

        "MARK_ATTENDANCE"

    ]

};


// =====================================================
// PERMISSION CHECKER
// =====================================================

const hasPermission = (

    role,

    permission

) => {

    if (!role || !permission) {

        return false;

    }


    // =================================================
    // NORMALIZE ROLE
    // =================================================

    const normalizedRole = String(role)
        .trim()
        .toLowerCase();


    // =================================================
    // FIND ROLE
    // =================================================

    const actualRole = Object.keys(permissions)
        .find(

            key =>
                key.toLowerCase() === normalizedRole

        );


    // =================================================
    // ROLE NOT FOUND
    // =================================================

    if (!actualRole) {

        return false;

    }


    // =================================================
    // CHECK PERMISSION
    // =================================================

    return (

        permissions[actualRole] || []

    ).includes(permission);

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    permissions,

    hasPermission

};