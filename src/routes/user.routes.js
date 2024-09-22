import { Router } from "express";
import { 
    logoutUser,
    loginUser,
    registerUser,
    refreshAccessToken, changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router()


// Syntax for different route file  

router.route("/register").post(
    // multer middleware use to handle the file - use  upload.field which accept array
    upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name:"coverImage",
        maxCount: 1
    }
]),registerUser)
// router.route("/login").post(login)

// Login route with post Request
router.route("/login").post(loginUser)


// secure routes
// Logout route with post request and one verifyJWT middleware
router.route("/logout").post(verifyJWT , logoutUser)

// this route is use to get the refresh token 
router.route("/refresh-token").post(refreshAccessToken)

// Change password route
router.route("/change-password").post(verifyJWT,
    changeCurrentPassword)

//  Use to get current user
router.route("/cuurent-user").get(verifyJWT,getCurrentUser)

// update account details router
router.route("/update-account").patch(verifyJWT,updateAccountDetails)

// update the avatar routes

// upload.single - use to upload single file
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

// update cover Image
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)

// Get channel profile
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

// Wacth History route
router.route("/history").get(verifyJWT,getWatchHistory)


export default router