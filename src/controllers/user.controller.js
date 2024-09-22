import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"



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
    if(!(username || email)) {
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
            $unset:{
                refreshToken: 1 // this remove the field from document
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


// refresh token end point
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // refreshToken form cookies otherwise body 

    // if Request not available
    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        // jwt.verify use to check that the Request token is correct or not
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        // That how we get the user
        const user = await User.findById(decodedToken?._id)
    
    
        // if user not get
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
    
        // Match incomingRefreshToken with user refresh token
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken)
        .json(new ApiResponse(200, {accessToken,refreshToken:newRefreshToken},
            "Access Token Refreshed Successfully"
        ))
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})


// Subscription controller - Password Change controller
const changeCurrentPassword = asyncHandler( async(req,res)=>{
    
    // Taking old and new password 
    const {oldPassword, newPassword} = req.body

    // If user required conformPassword then 
    // if(!(newPassword === confPassword){throw new apiError(401,"Password not match")})

    // Find user 
    const user = await User.findById(req.user?._id)

    // check the old password is correct or not for generating new password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    // If old password is wrong then throw apiError
    if(!isPasswordCorrect){
        throw new ApiError(404,"Invalid Old Password")
    }

    // set user password to new password
    user.password = newPassword

    // user need to be save in database
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))
})


// Get current User
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, 
        res.user,
        "Current user fetched Successfully"))
})


// Update account details
const updateAccountDetails = asyncHandler( async(req,res)=>{
    const {fullName , email} = req.body
    // Its better to update file in another controller 

    // check the field
    if(!(fullName || email)) {
        throw new ApiError(400, "All field are required")
    }

    // update the user details 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")
    // new is use to return info after update

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updates Successfully"))
})


// Update User Avatar
const updateUserAvatar = asyncHandler(async(req,res)=>{
    // through multer middlware we get the file 
    // In this we only required single file then no need to use files beacuse it accept multiple files
    const avatarLocalPath = req.file?.path

    // we can save as it is in database - avatarLocalPath
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    // Uploading on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    // if avatar url is not present
    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    // Update avatar
    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Updated Avatar Image"))

})

// Update Cover Image
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    // through multer middlware we get the file 
    // In this we only required single file then no need to use files beacuse it accept multiple files
    const coverImageLocalPath = req.file?.path

    // we can save as it is in database - avatarLocalPath
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }

    // Uploading on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if avatar url is not present
    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading on cover Image")
    }

    // Update avatar
    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar: coverImage.url
        }
    },
    {new:true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200,user,"Updated Cover Image"))
})


// Adding Aggregation Pipeline
const getUserChannelProfile = asyncHandler(async(req,res)=>{

    // get the url
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is Missing")
    }
    
    // find the document from the user name
    // User.find({username}) // We can directly apply Aggregation pipeline , as we don't need to take user from database and then apply Aggregation


    // aggregate the channel and apply the pipelines
    const channel = await User.aggregate([
        // match use to match the document according to specific criteria
        {
        $match : {
            username: username?.toLowerCase()
            }
        },
        //Those document which passed the above pipeline are passed to next pipeline for join the documents
        {
           $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
           } 
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // $addFields pipeline add the field with existing fields
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                   $size: "subscribedTo" 
                },
                isSubscribed : {
                    // $cond - accept 3 argument if (to check the expression), then (if true then condition), else (if not else condition)
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        // Only selected document passes
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])
    console.log(channel);
    
    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User Channel fetched Successfully"))
})


// Nested pipeline for geting the user history 
const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // return value in the form of Array in owner field  
                    // Another pipeline to manage array
                    {
                        $addFields: {
                            // To take 1st element from the array 
                            // There are two method 
                            // $arrayElementAt[0]
                            // $first
                            // It will give the object so futher use (.) to extract the value 
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return  res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history feteched Successfully"
        )
    )
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}