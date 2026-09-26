const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


// Routes

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const childRoutes = require("./routes/childRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const attendanceReportRoutes = require("./routes/attendanceReportRoutes");
const followUpRoutes = require("./routes/followUpRoutes");
const memberRoutes = require("./routes/memberRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");




dotenv.config();



const app = express();




// =====================================================
// Security Middleware
// =====================================================


app.use(
    helmet()
);






// =====================================================
// CORS
// =====================================================

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8081",
    "http://localhost:8082",
];

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests with no origin
            // This includes tools such as Postman
            // and some native app requests.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("CORS blocked origin:", origin);

            return callback(
                new Error(`Not allowed by CORS: ${origin}`)
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);





// =====================================================
// Body Parsers
// =====================================================


app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended:true
    })
);






// =====================================================
// Logging
// =====================================================


if(process.env.NODE_ENV !== "production"){

    app.use(
        morgan("dev")
    );

}








// =====================================================
// API Routes
// =====================================================


const API = "/api";



app.use(
    `${API}/auth`,
    authRoutes
);



app.use(
    `${API}/users`,
    userRoutes
);



app.use(
    `${API}/users/children`,
    childRoutes
);



app.use(
    `${API}/attendance`,
    attendanceRoutes
);



app.use(
    `${API}/services`,
    serviceRoutes
);



app.use(
    `${API}/dashboard`,
    dashboardRoutes
);



app.use(
    `${API}/attendance/report`,
    attendanceReportRoutes
);



app.use(
    `${API}/followups`,
    followUpRoutes
);



app.use(
    `${API}/members`,
    memberRoutes
);



app.use(
    `${API}/reports`,
    reportRoutes
);



app.use(
    `${API}/notifications`,
    notificationRoutes
);









// =====================================================
// Health Check
// =====================================================


app.get(
    "/health",
    (req,res)=>{


        res.status(200).json({

            success:true,

            message:
            "Shepherd API is running",

            environment:
            process.env.NODE_ENV || "development"

        });


    }
);








// =====================================================
// Root Route
// =====================================================


app.get(
    "/",
    (req,res)=>{


        res.status(200).json({

            success:true,

            message:
            "Welcome to Shepherd API"

        });


    }
);









// =====================================================
// 404 Handler
// =====================================================


app.use(
(req,res)=>{


    res.status(404).json({

        success:false,

        message:
        `Route ${req.originalUrl} not found`

    });


}

);








// =====================================================
// Global Error Handler
// =====================================================


app.use(
(error,req,res,next)=>{


    console.error(error);



    res.status(
        error.statusCode || 500
    )
    .json({

        success:false,

        message:
        error.message ||
        "Server error"

    });


}

);







module.exports = app;