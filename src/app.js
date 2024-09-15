import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// COR configuration middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// JSON middleware
app.use(express.json({limit:"16kb"}))

// URL Encoder middleware
app.use(express.urlencoded({extended:true, limit:"16kb"}))

// Static configuration middleware
app.use(express.static("public"))

// cookieParser configuration middleware
app.use(cookieParser())


// Routes 
// Not need to import at the top you can import when you use 
// give userRouter name when it export default
import userRouter from "./routes/user.routes.js"


// routes declaration
// When you write routes in same file where .get the route 

//---- app.use as middleware to use route due to separate the route file

// It good to define the your url if you are designing api - So use /api/v1 as prefix with version
app.use("/api/v1/users", userRouter) // act as prefix 

// http:/loaclhost:8000/api/v1/users/register
// http:/loaclhost:8000/api/v1/users/login

export { app }