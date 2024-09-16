// Varify that user present or not 

import  jwt  from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// if res is not use then add simple _ 

export const verifyJWT = asyncHandler(async(req,_,next) => {
    try {
        // Use option chaining- maybe cookie is not available
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        // If token is not available
        if(!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
    
        // use to verify that token 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // finding the user by id 
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if(!user) {
    
            throw new ApiError(401,"Invalid Access Token")
        }
    
        // If user find 
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Authencation Middleware Error :- Invalid Access Token" )
    }

})