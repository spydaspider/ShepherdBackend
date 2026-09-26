const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema(

{

// ==========================================
// Recipient
// ==========================================

recipient:{

    type:mongoose.Schema.Types.ObjectId,

    ref:"User",

    required:true

},





// ==========================================
// Sender
// ==========================================

sender:{

    type:mongoose.Schema.Types.ObjectId,

    ref:"User",

    default:null

},





// ==========================================
// Notification Content
// ==========================================

title:{

    type:String,

    required:true,

    trim:true

},



message:{

    type:String,

    required:true,

    trim:true

},






// ==========================================
// Notification Category
// ==========================================

type:{

    type:String,

    enum:[

        "FollowUp",

        "Service",

        "Attendance",

        "Announcement",

        "Reminder",

        "System"

    ],

    default:"System"

},






// ==========================================
// Priority
// ==========================================

priority:{

    type:String,

    enum:[

        "Low",

        "Normal",

        "High"

    ],

    default:"Normal"

},






// ==========================================
// Related Data
// ==========================================

relatedId:{

    type:mongoose.Schema.Types.ObjectId,

    default:null

},



relatedModel:{

    type:String,

    enum:[

        "Service",

        "FollowUp",

        "Attendance",

        "User",

        null

    ],

    default:null

},






// ==========================================
// Frontend Navigation
// ==========================================

actionUrl:{

    type:String,

    default:""

},






// ==========================================
// Read Status
// ==========================================

isRead:{

    type:Boolean,

    default:false

},



readAt:{

    type:Date,

    default:null

}

},

{

timestamps:true

}

);









// ==========================================
// Indexes
// ==========================================


// Fast user notification lookup

notificationSchema.index({

recipient:1,

createdAt:-1

});




// Fast unread count

notificationSchema.index({

recipient:1,

isRead:1

});




// Related records

notificationSchema.index({

relatedId:1

});







module.exports = mongoose.model(

"Notification",

notificationSchema

);