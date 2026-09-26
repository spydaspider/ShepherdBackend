const {
    hasPermission
} = require("../config/permissions");


// =====================================================
// CHECK PERMISSION
// =====================================================

const checkPermission = (permission) => {

    return (req, res, next) => {

        try {

            // ==========================================
            // AUTHENTICATION
            // ==========================================

            if (!req.user) {

                return res.status(401).json({

                    success: false,

                    message: "Authentication required"

                });

            }


            // ==========================================
            // USER ROLE
            // ==========================================

            const userRole = req.user.role;


            if (!userRole) {

                return res.status(403).json({

                    success: false,

                    message: "User role not assigned"

                });

            }


            // ==========================================
            // CHECK PERMISSION
            // ==========================================

            const allowed = hasPermission(

                userRole,

                permission

            );


            // ==========================================
            // ACCESS DENIED
            // ==========================================

            if (!allowed) {

                return res.status(403).json({

                    success: false,

                    message:
                        `Access denied. Missing permission: ${permission}`

                });

            }


            // ==========================================
            // ALLOWED
            // ==========================================

            next();

        }

        catch (error) {

            console.error(
                "Permission Middleware Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message: "Permission check failed"

            });

        }

    };

};


module.exports = checkPermission;