const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// =====================================
// LOAD BACKEND .ENV
// =====================================

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

// =====================================
// IMPORT DATABASE + MODEL
// =====================================

const connectDB = require("../config/db");
const User = require("../models/User");

// =====================================
// SEED USERS
// =====================================

const seedUsers = async () => {

    try {

        // Check environment variable
        if (!process.env.MONGO_URI) {

            console.error(
                "❌ MONGO_URI is not loaded."
            );

            console.error(
                "Expected .env at:",
                path.resolve(__dirname, "../.env")
            );

            process.exit(1);
        }

        console.log(
            "✅ MONGO_URI loaded."
        );

        // Connect database
        await connectDB();

        // =====================================
        // USERS TO CREATE
        // =====================================

        const users = [

            {
                firstName: "System",
                lastName: "Admin",
                email: "spydaspider@gmail.com",
                phone: "0000000001",
                password: "Admin@123456",
                gender: "Male",
                dateOfBirth: new Date("1980-01-01"),

                role: "Admin",
                membershipType: "Member",

                hasAccount: true,
                loginEnabled: true,
                mustChangePassword: true,

                isVerified: true,
                phoneVerified: true,

                status: "Active",
                isActive: true,

                registrationSource: "Admin"
            },

            {
                firstName: "Church",
                lastName: "Pastor",
                email: "pastor@shepherd.com",
                phone: "0000000002",
                password: "Pastor@123456",
                gender: "Male",
                dateOfBirth: new Date("1980-01-01"),

                role: "Pastor",
                membershipType: "Pastor",

                hasAccount: true,
                loginEnabled: true,
                mustChangePassword: true,

                isVerified: true,
                phoneVerified: true,

                status: "Active",
                isActive: true,

                registrationSource: "Admin"
            },

            {
                firstName: "Church",
                lastName: "Leader",
                email: "leader@shepherd.com",
                phone: "0000000003",
                password: "Leader@123456",
                gender: "Male",
                dateOfBirth: new Date("1980-01-01"),

                role: "Leader",
                membershipType: "Leader",

                hasAccount: true,
                loginEnabled: true,
                mustChangePassword: true,

                isVerified: true,
                phoneVerified: true,

                status: "Active",
                isActive: true,

                registrationSource: "Admin"
            },

            {
                firstName: "Church",
                lastName: "Secretary",
                email: "secretary@shepherd.com",
                phone: "0000000004",
                password: "Secretary@123456",
                gender: "Female",
                dateOfBirth: new Date("1980-01-01"),

                role: "Secretary",
                membershipType: "Member",

                hasAccount: true,
                loginEnabled: true,
                mustChangePassword: true,

                isVerified: true,
                phoneVerified: true,

                status: "Active",
                isActive: true,

                registrationSource: "Admin"
            }

        ];

        // =====================================
        // CREATE / UPDATE USERS
        // =====================================

        for (const userData of users) {

            let user = await User.findOne({
                email: userData.email
            });

            if (user) {

                console.log(
                    ` ${userData.email} already exists. Updating...`
                );

                user.firstName =
                    userData.firstName;

                user.lastName =
                    userData.lastName;

                user.phone =
                    userData.phone;

                user.gender =
                    userData.gender;

                user.dateOfBirth =
                    userData.dateOfBirth;

                user.role =
                    userData.role;

                user.membershipType =
                    userData.membershipType;

                user.hasAccount =
                    userData.hasAccount;

                user.loginEnabled =
                    userData.loginEnabled;

                user.mustChangePassword =
                    userData.mustChangePassword;

                user.isVerified =
                    userData.isVerified;

                user.phoneVerified =
                    userData.phoneVerified;

                user.status =
                    userData.status;

                user.isActive =
                    userData.isActive;

                await user.save();

                console.log(
                    `Updated ${userData.email}`
                );

            } else {

                user = await User.create(
                    userData
                );

                console.log(
                    `Created ${userData.email}`
                );
            }
        }

        console.log("");
        console.log(
            "====================================="
        );
        console.log(
            "USER SEEDING COMPLETED"
        );
        console.log(
            "====================================="
        );

        await mongoose.connection.close();

        process.exit(0);

    }
    catch (error) {

        console.error("");
        console.error(
            "SEED ERROR:"
        );
        console.error(
            error.message
        );

        await mongoose.connection.close();

        process.exit(1);
    }
};

// =====================================
// RUN
// =====================================

seedUsers();