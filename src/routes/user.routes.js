import { Router } from "express";
import { logoutUser,loginUser,registerUser } from "../controllers/user.controller.js";

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


export default router