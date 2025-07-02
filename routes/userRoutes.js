import express from "express"
import { registerUser, loginUser, getUserProfile, updateUserProfile } from "../controllers/userController.js"
import { authenticateJWT } from "../middleware/authMiddleware.js"

const userRouter = express.Router()

// Rutas públicas
userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

// Rutas protegidas
userRouter.get("/profile", authenticateJWT, getUserProfile)
userRouter.put("/profile", authenticateJWT, updateUserProfile)

export { userRouter }