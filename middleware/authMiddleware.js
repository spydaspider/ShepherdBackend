const jwt = require("jsonwebtoken");
const User = require("../models/User");





// =====================================================
// Protect Routes
// Verify JWT and attach user
// =====================================================

const protect = async (req, res, next) => {


    try {


        let token;



        // Check Authorization Header

        if(

            req.headers.authorization &&

            req.headers.authorization.startsWith("Bearer")

        ){


            token =
            req.headers.authorization.split(" ")[1];



        }
        else{


            return res.status(401).json({

                success:false,

                message:"Not authorized, no token"

            });


        }






        // Verify token

        const decoded =
        jwt.verify(

            token,

            process.env.JWT_SECRET

        );







        // Get user from database

        const user =
        await User.findById(decoded.id)
        .select("-password");






        if(!user){


            return res.status(401).json({

                success:false,

                message:"User no longer exists"

            });


        }







        // Check account status

        if(user.isActive === false){


            return res.status(403).json({

                success:false,

                message:"Account has been disabled"

            });


        }







        // Attach user to request

        req.user = user;






        next();





    }
    catch(error){


        return res.status(401).json({

            success:false,

            message:"Not authorized, token failed"

        });


    }



};





module.exports = {

    protect

};