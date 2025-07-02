import jwt from "jsonwebtoken"
import User from "../models/userModel.js"

export const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ message: "Acceso denegado. Token no proporcionado" })
        }

        const token = authHeader.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Obtener el usuario y sus grupos
        const user = await User.findById(decoded.id).select("groups")

        if (!user) {
            return res.status(401).json({ message: "Usuario no válido" })
        }

        // Añadir información del usuario a la solicitud
        req.user = {
            id: decoded.id,
            groups: user.groups,
        }

        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expirado" })
        }

        return res.status(401).json({ message: "Token no válido" })
    }
}
