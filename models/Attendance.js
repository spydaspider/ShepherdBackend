const mongoose = require("mongoose");



const attendanceSchema = new mongoose.Schema(

{

// =====================================
// Member
// =====================================

user:{

    type:mongoose.Schema.Types.ObjectId,

    ref:"User",

    required:true

},







// =====================================
// Service
// =====================================

service:{

    type:mongoose.Schema.Types.ObjectId,

    ref:"Service",

    required:true

},







// =====================================
// Attendance Status
// =====================================


status:{


    type:String,


    enum:[

        "Present",

        "Absent",

        "Excused"

    ],


    default:"Absent"


},







// =====================================
// Attendance Method
// =====================================


attendanceMethod:{


    type:String,


    enum:[


        "Self",

        "Parent",

        "Admin"


    ],


    default:"Self"


},







// =====================================
// Person Who Marked Attendance
// =====================================


markedBy:{


    type:mongoose.Schema.Types.ObjectId,


    ref:"User",


    default:null


},







// =====================================
// Attendance Dates
// =====================================


attendanceDate:{


    type:Date,


    default:Date.now 


},






checkedInAt:{


    type:Date,


    default:Date.now 


},







// =====================================
// Additional Notes
// =====================================


notes:{


    type:String,


    trim:true,


    default:""


},







// =====================================
// Soft Delete
// =====================================


isDeleted:{


    type:Boolean,


    default:false


}



},


{

timestamps:true

}

);









// =====================================
// Prevent Duplicate Attendance
// =====================================


attendanceSchema.index(

{

    user:1,

    service:1

},

{

    unique:true

}

);









// =====================================
// Reports Optimisation
// =====================================


attendanceSchema.index({

    service:1,

    status:1

});





attendanceSchema.index({

    user:1,

    status:1

});





attendanceSchema.index({

    createdAt:-1

});









// =====================================
// Virtual
// =====================================


attendanceSchema.virtual(

"attendanceLabel"

)

.get(function(){


return `${this.status} attendance`;


});









// =====================================
// Include Virtuals
// =====================================


attendanceSchema.set(

"toJSON",

{

virtuals:true

}

);



attendanceSchema.set(

"toObject",

{

virtuals:true

}

);








module.exports = mongoose.model(

"Attendance",

attendanceSchema

);