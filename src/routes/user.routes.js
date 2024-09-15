import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"

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

export default router