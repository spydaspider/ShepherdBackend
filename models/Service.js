const mongoose = require("mongoose");



const serviceSchema = new mongoose.Schema(

{

// =====================================================
// SERVICE INFORMATION
// =====================================================


name:{

    type:String,

    required:[
        true,
        "Service name is required"
    ],

    trim:true

},




serviceType:{

    type:String,

    enum:[

        "Sunday Worship",

        "Sunday Evening",

        "Bible Study",

        "Prayer Meeting",

        "Youth Service",

        "Children Service",

        "Special Service",

        "Convention",

        "Funeral",

        "Wedding",

        "Other"

    ],

    required:true

},





serviceDate:{

    type:Date,

    required:true

},





startTime:{

    type:String,

    default:""

},




endTime:{

    type:String,

    default:""

},





description:{

    type:String,

    trim:true,

    default:""

},







// =====================================================
// SERVICE STATUS
// =====================================================


status:{


    type:String,


    enum:[

        "Scheduled",

        "Active",

        "Completed",

        "Cancelled"

    ],


    default:"Scheduled"


},







// =====================================================
// ATTENDANCE CONTROL
// =====================================================


attendanceCode:{


    type:String,


    required:true,


    unique:true,


    trim:true


},






codeExpiresAt:{


    type:Date,


    required:true


},






attendanceOpen:{


    type:Boolean,


    default:false


},







// =====================================================
// ATTENDANCE SUMMARY
// =====================================================


attendanceSummary:{



    totalPresent:{


        type:Number,


        default:0


    },





    totalAbsent:{


        type:Number,


        default:0


    },





    adultsPresent:{


        type:Number,


        default:0


    },





    childrenPresent:{


        type:Number,


        default:0


    },





    malePresent:{


        type:Number,


        default:0


    },





    femalePresent:{


        type:Number,


        default:0


    },





    attendanceRate:{


        type:Number,


        default:0


    }



},







// =====================================================
// SERVICE CLOSING
// =====================================================


closedAt:{


    type:Date,


    default:null


},









// =====================================================
// AUDIT
// =====================================================


generatedBy:{


    type:mongoose.Schema.Types.ObjectId,


    ref:"User",


    required:true


}



},


{

    timestamps:true

}

);










// =====================================================
// INDEXES
// =====================================================



// Latest services

serviceSchema.index({

    serviceDate:-1

});






// Active attendance lookup

serviceSchema.index({

    status:1,

    attendanceOpen:1

});












// Prevent duplicate service type same day

serviceSchema.index({

    serviceType:1,

    serviceDate:1

});









// =====================================================
// VIRTUALS
// =====================================================


serviceSchema.virtual(
"attendancePercentage"
)
.get(function(){


return this.attendanceSummary?.attendanceRate || 0;


});






serviceSchema.set(
"toJSON",
{
    virtuals:true
}
);



serviceSchema.set(
"toObject",
{
    virtuals:true
}
);









// =====================================================
// VALIDATION BEFORE SAVE
// =====================================================


serviceSchema.pre(
"save",
function(next){



if(

this.status === "Completed"

){

    this.attendanceOpen=false;


}





if(

this.status === "Cancelled"

){

    this.attendanceOpen=false;


}





next();


});









module.exports =
mongoose.model(
    "Service",
    serviceSchema
);