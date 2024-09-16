import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { application } from "express"


// method to generate access and refresh token

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        // user find by using id
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        // add refresh token in database
        user.refreshToken = refreshToken
        // user.save use to save data in database
        await user.save({ validateBeforeSave: false}) // valid means just save what we write

        return {accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went worng while generating refresh and access token")
    }
}





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

// req.body response
// console.log("req.body response", req.body);


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
    const existedUser = await User.findOne({
        // $operator to perfrom operations
        // $or take array and we pass all the object which we want to Check
        
        $or: [{ username },{ email }]
    })

     if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
     }   

    
// response of req.file-
// console.log("req.files response\n",req.files);


    // Check for image , check for avatar
    // May be that file exist or not exits - Optional chaining
    const avatarLoaclPath = req.files?.avatar[0]?.path; // it gives you the whole path which is uploaded by multer

    // const coverImageLocalPath = req.files?.coverImage[0]?.path // it give error of can't read empty element

    // classic if else for checking coverImage
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

     if(!avatarLoaclPath){
        throw new ApiError(400 , "Avatar file is required")
     }


// avatarLoaclPath response 
// console.log("avatarLoaclPath response", avatarLoaclPath);


    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLoaclPath) 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 


// avatar response
// console.log("avatar response", avatar);


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
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"))

})


// Login -----------------------------------
const loginUser = asyncHandler( async (req,res) => {
    // todo 
    // req body -> data
    // check username or email
    // find the user 
    // password check
    // access and refresh token generation
    // send cookie
    // res succeess


    // req body -> data -------
    const {email, username, password} = req.body

    // check username or email
    if(!username || !email) {
        throw new ApiError(400 , "username or email is required")
    }

    // find the user
    const user = await User.findOne({
        $or:[{email},{username}] // this is use to find user either oon the basis of email or username 
    })

    // User is available to perfrom mongodb mongoose method

    // If user not found
    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    // all the method define by user then it available on user variable not mongodb mongoose method User

    // Check the password 
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid User Password")
    }

    // access and refresh token generation
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // update the object otherwise run one more database query
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookie
    const options = {
        httpOnly: true,// only modified through server but not any frontend user
        secure: true
    }


    // set the refresh and access token
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {user: loggedInUser,accessToken,refreshToken},
            "User Logged In Successfully"
        )
    )

})


// Logout ------------------------------------
const logoutUser = asyncHandler(async(req,res)=>{
    // find user but there is no access of id
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        { // added to add new value instead of old value in which refresh Token also generated
            new: true
        }
    )

    // Options is required for passing the cookies 
    const options = {
        httpOnly: true,
        secure: true
    }


    // .clearCookie use to clear the cookie in which you have to pass token and option
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export {registerUser,
    loginUser,
    logoutUser
}