import express from "express"
import {
    createGroup,
    getGroups,
    getUserGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    adminGetAllGroups,
    adminGetGroupById,
    adminUpdateGroupById,
    adminDeleteGroupById,
    findGroupByInviteCode,
    requestJoinGroup,
    approveJoinRequest,
    rejectJoinRequest,
    changeMemberRole,
    removeMember,
    searchGroups,
    getPendingGroups,
    approveGroup,
    rejectGroup
} from "../controllers/groupController.js"
import { authenticateJWT, isAdmin } from "../middleware/authMiddleware.js"

const groupRouter = express.Router()

// Todas las rutas ya están protegidas por el middleware en app.js

groupRouter.post("/", createGroup)
groupRouter.get("/", getGroups)
groupRouter.get("/user", getUserGroups) // Solo grupos donde es miembro
groupRouter.get("/search", searchGroups) // Búsqueda por nombre
groupRouter.get("/invite/:code", findGroupByInviteCode) // Búsqueda por código
groupRouter.post("/invite/:code/join", requestJoinGroup) // Solicitar unirse
groupRouter.get("/:id", getGroupById)
groupRouter.put("/:id", updateGroup)
groupRouter.delete("/:id", deleteGroup)

// Gestión de miembros
groupRouter.post("/:groupId/approve/:userId", approveJoinRequest)
groupRouter.post("/:groupId/reject/:userId", rejectJoinRequest)
groupRouter.put("/:groupId/members/:userId/role", changeMemberRole)
groupRouter.delete("/:groupId/members/:userId", removeMember)

// Rutas solo para admin
groupRouter.get("/admin/all", authenticateJWT, isAdmin, adminGetAllGroups)
groupRouter.get("/admin/:id", authenticateJWT, isAdmin, adminGetGroupById)
groupRouter.put("/admin/:id", authenticateJWT, isAdmin, adminUpdateGroupById)
groupRouter.delete("/admin/:id", authenticateJWT, isAdmin, adminDeleteGroupById)

// Rutas de moderación (solo admin)
groupRouter.get("/moderation/pending", authenticateJWT, isAdmin, getPendingGroups)
groupRouter.post("/moderation/:id/approve", authenticateJWT, isAdmin, approveGroup)
groupRouter.post("/moderation/:id/reject", authenticateJWT, isAdmin, rejectGroup)

export { groupRouter }