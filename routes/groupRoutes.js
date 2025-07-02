import express from "express"
import {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
} from "../controllers/groupController.js"

const groupRouter = express.Router()

// Todas las rutas ya están protegidas por el middleware en app.js

groupRouter.post("/", createGroup)
groupRouter.get("/", getGroups)
groupRouter.get("/:id", getGroupById)
groupRouter.put("/:id", updateGroup)
groupRouter.delete("/:id", deleteGroup)

export { groupRouter }