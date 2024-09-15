import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async(req,res) =>{
    // res.status(200).json({
    //     message: "Code aur fun"
    // })


    // steps to register user 
    //  1. user write info - name ,fullName, email, password // Get user details from frontend
    // Validation - not empty
    // Check if user already exists: username , email
    // Check for image , check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db 
    // remove password and refresh token field from response
    // Check for user creation
    // return response
    //  2. take user data - post to create new user
    // 3. register button to register


    // Get data from the user
    const {fullName,email,username,password} = req.body
    // console.log(`email: ${email}`);

    // if (fullName === ""){
    //     throw new ApiError(400, "Full Name is required")
    // }
    
    // for Better approach 
    // Validation - not empty
    if (
        [fullName, email, username , password].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required ")
    } 
    

    // Check if user already exists: username , email
    const existedUser = User.findOne({
        // $operator to perfrom operations
        // $or take array and we pass all the object which we want to Check
        
        $or: [{ username },{ email }]
    })

     if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
     }   

    
    // Check for image , check for avatar
    // May be that file exist or not exits - Optional chaining
    const avatarLoaclPath = req.files?.avatar[0]?.path; // it gives you the whole path which is uploaded by multer
    const coverImageLocalPath = req.files?.coverImage[0]?.path

     if(!avatarLoaclPath){
        throw new ApiError(400 , "Avatar file is required")
     }


    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLoaclPath) 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

    // If avatar not available then throw error 
    if(!avatar) {
        throw new ApiError(400 , "Avatar file is required")
    }


    // create user object - create entry in db 
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        // take of coverImage if not available
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // check user is empty or not 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // select method - use to pass the field which want to select
    // default all selected , So for field which you don't want "-fieldName" add minus sign with field
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    // return response
    return res.status(201).json(new ApiError(200, createdUser, "User registered Successfully"))

})

export {registerUser}