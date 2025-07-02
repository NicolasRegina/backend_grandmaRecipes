import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import dotenv from "dotenv"
import { recipeRouter, groupRouter, userRouter } from "./routes/index.js"
import { authenticateJWT } from "./middleware/authMiddleware.js"
import cors from "cors"

dotenv.config()

const app = express()

app.use(cors({
    origin: "http://localhost:5173", // solo permite requests desde tu frontend
    credentials: true
}));

// Conexión a MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("Error al conectar MongoDB:", err))

// Configuración de directorios y middleware
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json()) //sirve para q parsee bien el json
app.use(express.static(path.join(__dirname, "public"))) //para q sirva el html y css

// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Rutas de la API
app.use("/api/users", userRouter)
app.use("/api/recipes", authenticateJWT, recipeRouter)
app.use("/api/groups", authenticateJWT, groupRouter)

// Iniciar servidor
app.listen(3000, () => {
    console.log('Server is running on port 3000');
})
