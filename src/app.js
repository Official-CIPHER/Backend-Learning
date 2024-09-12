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
 

export { app }