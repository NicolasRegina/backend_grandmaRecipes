import express from "express"
import { registerUser, loginUser, getUserProfile, updateUserProfile, getAllUsers, getUserById, updateUserById, deleteUserById, registerUserByAdmin } from "../controllers/userController.js"
import { authenticateJWT, isAdmin } from "../middleware/authMiddleware.js"

const userRouter = express.Router()

// Rutas públicas
userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

// Rutas protegidas
userRouter.get("/profile", authenticateJWT, getUserProfile)
userRouter.put("/profile", authenticateJWT, updateUserProfile)

// Rutas solo para admin
userRouter.get("/", authenticateJWT, isAdmin, getAllUsers) // Listar todos los usuarios
userRouter.post("/admin/register", authenticateJWT, isAdmin, registerUserByAdmin) // Registrar usuario por admin
userRouter.get("/:id", authenticateJWT, isAdmin, getUserById) // Obtener usuario por id
userRouter.put("/:id", authenticateJWT, isAdmin, updateUserById) // Actualizar usuario por id
userRouter.delete("/:id", authenticateJWT, isAdmin, deleteUserById) // Eliminar usuario por id

export { userRouter }