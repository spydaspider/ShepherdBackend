const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const userSchema = new mongoose.Schema(
{

// =====================================================
// PERSONAL INFORMATION
// =====================================================

firstName:{
    type:String,
    required:[
        true,
        "First name is required"
    ],
    trim:true
},

lastName:{
    type:String,
    required:[
        true,
        "Last name is required"
    ],
    trim:true
},

email:{
    type:String,
    lowercase:true,
    trim:true,
    unique:true,
    sparse:true
},

phone:{
    type:String,
    trim:true,
    unique:true,
    sparse:true
},

profileImage:{
    type:String,
    default:""
},

gender:{
    type:String,
    enum:[
        "Male",
        "Female"
    ],
    required:true
},

dateOfBirth:{
    type:Date,
    default:null
},

maritalStatus:{
    type:String,
    enum:[
        "Single",
        "Married",
        "Divorced",
        "Widowed"
    ],
    default:"Single"
},

occupation:{
    type:String,
    trim:true,
    default:""
},

address:{
    type:String,
    trim:true,
    default:""
},

gpsLocation:{
    latitude:Number,
    longitude:Number
},

emergencyContact:{
    type:String,
    default:""
},

emergencyPhone:{
    type:String,
    default:""
},



// =====================================================
// ACCOUNT MANAGEMENT
// =====================================================

hasAccount:{
    type:Boolean,
    default:false
},

loginEnabled:{
    type:Boolean,
    default:false
},

password:{
    type:String,
    minlength:6,
    select:false,
    required:function(){
        return this.hasAccount;
    }
},

mustChangePassword:{
    type:Boolean,
    default:false
},

// =====================================================
// PASSWORD RESET
// =====================================================

passwordResetCode:{
    type:String,
    default:null,
    select:false
},

passwordResetExpires:{
    type:Date,
    default:null,
    select:false
},

passwordResetVerified:{
    type:Boolean,
    default:false,
    select:false
},

passwordResetVerifiedExpires:{
    type:Date,
    default:null,
    select:false
},

accountCreatedAt:{
    type:Date,
    default:null
},

accountCreatedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},

lastLogin:{
    type:Date,
    default:null
},



// =====================================================
// CHURCH INFORMATION
// =====================================================

membershipNumber:{
    type:String,
    unique:true,
    sparse:true
},

joinedChurchDate:{
    type:Date,
    default:Date.now
},

baptized:{
    type:Boolean,
    default:false
},

branch:{
    type:String,
    default:"Main Branch"
},

department:{
    type:String,
    default:""
},

cellGroup:{
    type:String,
    default:""
},

area:{
    type:String,
    default:""
},

membershipType:{
    type:String,
    enum:[
        "Visitor",
        "New Convert",
        "Member",
        "Worker",
        "Leader",
        "Pastor"
    ],
    default:"Member"
},



// =====================================================
// SYSTEM ROLE
// =====================================================

role:{
    type:String,

    enum:[
        "Member",
        "Child",
        "Leader",
        "Secretary",
        "Pastor",
        "Admin"
    ],

    default:"Member"
},

roleAssignedAt:{
    type:Date,
    default:null
},

roleAssignedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},



// =====================================================
// MEMBER STATUS
// =====================================================

status:{
    type:String,
    enum:[
        "Active",
        "Inactive",
        "Transferred",
        "Suspended"
    ],
    default:"Active"
},

isActive:{
    type:Boolean,
    default:true
},

deleted:{
    type:Boolean,
    default:false
},

registrationSource:{
    type:String,
    enum:[
        "Online",
        "Parent",
        "Admin",
        "Import",
        "Visitor"
    ],
    default:"Admin"
},



// =====================================================
// FAMILY MANAGEMENT
// =====================================================

isChild:{
    type:Boolean,
    default:false
},

parent:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},

guardian:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},

children:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
],

familyId:{
    type:String,
    index:true,
    default:null
},



// =====================================================
// ATTENDANCE TRACKING
// =====================================================

totalAttendance:{
    type:Number,
    default:0
},

attendancePercentage:{
    type:Number,
    default:0,
    min:0,
    max:100
},

lastAttendance:{
    type:Date,
    default:null
},

lastServiceAttended:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Service",
    default:null
},



// =====================================================
// NOTIFICATION SETTINGS
// =====================================================

notificationSettings:{

    email:{
        type:Boolean,
        default:true
    },

    push:{
        type:Boolean,
        default:true
    },

    sms:{
        type:Boolean,
        default:false
    }

},



// =====================================================
// VERIFICATION
// =====================================================

isVerified:{
    type:Boolean,
    default:false
},

phoneVerified:{
    type:Boolean,
    default:false
},



// =====================================================
// AUDIT
// =====================================================

createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},

updatedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
}

},

{
    timestamps:true
});



// =====================================================
// PASSWORD HASHING
// =====================================================

userSchema.pre(
    "save",
    async function(next){

        if(
            !this.isModified("password")
        ){
            return next();
        }

        if(!this.password){
            return next();
        }

        const salt =
            await bcrypt.genSalt(10);

        this.password =
            await bcrypt.hash(
                this.password,
                salt
            );

        next();
    }
);



// =====================================================
// PASSWORD COMPARISON
// =====================================================

userSchema.methods.matchPassword =
async function(password){

    if(!this.password){
        return false;
    }

    return await bcrypt.compare(
        password,
        this.password
    );
};



// =====================================================
// FULL NAME VIRTUAL
// =====================================================

userSchema.virtual("fullName")
.get(function(){

    return `${this.firstName} ${this.lastName}`;

});



// =====================================================
// AGE VIRTUAL
// =====================================================

userSchema.virtual("age")
.get(function(){

    if(!this.dateOfBirth){
        return null;
    }

    const today =
        new Date();

    const birth =
        new Date(
            this.dateOfBirth
        );

    let age =
        today.getFullYear()
        -
        birth.getFullYear();

    const month =
        today.getMonth()
        -
        birth.getMonth();

    if(
        month < 0 ||
        (
            month === 0 &&
            today.getDate() < birth.getDate()
        )
    ){
        age--;
    }

    return age;
});



// =====================================================
// CHILD VALIDATION
// =====================================================

userSchema.pre(
    "save",
    function(next){

        if(
            this.isChild &&
            !this.parent
        ){
            return next(
                new Error(
                    "Child must have a parent"
                )
            );
        }

        next();
    }
);



// =====================================================
// DATABASE INDEXES
// =====================================================

userSchema.index({
    role:1
});

userSchema.index({
    status:1
});

userSchema.index({
    isActive:1
});

userSchema.index({
    parent:1
});

userSchema.index({
    membershipType:1
});

userSchema.index({
    firstName:1,
    lastName:1
});



// =====================================================
// INCLUDE VIRTUALS
// =====================================================

userSchema.set(
    "toJSON",
    {
        virtuals:true
    }
);

userSchema.set(
    "toObject",
    {
        virtuals:true
    }
);



// =====================================================
// EXPORT
// =====================================================

module.exports =
mongoose.model(
    "User",
    userSchema
);