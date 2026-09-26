const mongoose = require("mongoose");


const attendanceCodeSchema = new mongoose.Schema(
{

    code:{
        type:String,
        required:true
    },


    generatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },


    serviceDate:{
        type:Date,
        required:true
    },


    active:{
        type:Boolean,
        default:true
    },


    expiresAt:{
        type:Date,
        required:true
    }

},
{
    timestamps:true
});


module.exports =
mongoose.model(
    "AttendanceCode",
    attendanceCodeSchema
);