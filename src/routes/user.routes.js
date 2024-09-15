import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()


// Syntax for different route file  
router.route("/register").post(registerUser)
// router.route("/login").post(login)

export default router