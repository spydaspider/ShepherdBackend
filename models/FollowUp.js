const mongoose = require("mongoose");


const followUpSchema = new mongoose.Schema(

{

    member:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },


    service:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"Service",

        required:true

    },


    assignedTo:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },


    type:{

        type:String,

        enum:[

            "Phone Call",
            "Home Visit",
            "Message",
            "General Check"

        ],

        default:"Phone Call"

    },


    status:{

        type:String,

        enum:[

            "Pending",
            "Contacted",
            "Completed",
            "Unable To Reach"

        ],

        default:"Pending"

    },


    priority:{

        type:String,

        enum:[

            "Low",
            "Medium",
            "High"

        ],

        default:"Medium"

    },


    followUpDate:{

        type:Date,

        default:Date.now

    },


    outcome:{

        type:String,

        enum:[

            "No Response",
            "Will Return",
            "Moved Away",
            "Sick",
            "Busy",
            "Transferred",
            "Other"

        ],

        default:"Other"

    },


    notes:{

        type:String,

        default:""

    },


    contactedDate:{

        type:Date,

        default:null

    },


    completedDate:{

        type:Date,

        default:null

    },


    createdBy:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },


    updatedBy:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        default:null

    }


},

{

    timestamps:true

}

);





// Prevent duplicate follow-ups
followUpSchema.index(

{

    member:1,

    service:1

},

{

    unique:true

}

);





// Pending lookup
followUpSchema.index({

    status:1,

    followUpDate:1

});




// Assigned leader lookup
followUpSchema.index({

    assignedTo:1,

    status:1

});




// Member history
followUpSchema.index({

    member:1

});





module.exports =
mongoose.model(
    "FollowUp",
    followUpSchema
);