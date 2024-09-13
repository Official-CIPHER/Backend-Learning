import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
},
{timestamps:true})

// Use to hash the password just before save and asle check if modified then bcrypt the password
userSchema.pre("save",async function(next) {
    // check the if password  is not modified then return next method
    if(!this.isModified("password")) return next();

    // bcrypt the password
    this.password = bcrypt.hash(this.password, 10)
    next()
})

// Define the method using .methods.methodName
userSchema.methods.isPasswordCorrect = async function(password) {
    // check the password is correct or not using bcrypt.compare in which 1st parameter is data : string and 2nd is encrypted : string
     
    return await bcrypt.compare(password, this.password)

    // it return value as Boolean value if match then true otherwise false

}

// Method to generate the access token through jwt 
userSchema.methods.generateAccessToken = function(){
    // Not required async await because there is no encryption algo happen
    // sign method use to generate tokens
    return jwt.sign(
        // payload- which info required to be hold
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullName
        },
        // required some kind of secret key
        process.env.ACCESS_TOKEN_SECRET,
        // expiry in object using expiresIn
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Method to generate the refresh token through jwt 
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        // payload- which info required to be hold
        {
            _id: this._id,
            
        },
        // required some kind of secret key
        process.env.REFRESH_TOKEN_SECRET,
        // expiry in object using expiresIn
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
