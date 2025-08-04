import express from "express"
import {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    searchRecipes,
    adminGetAllRecipes,
    adminGetRecipeById,
    adminUpdateRecipeById,
    adminDeleteRecipeById,
    getPendingRecipes,
    approveRecipe,
    rejectRecipe
} from "../controllers/recipeController.js"
import { authenticateJWT, isAdmin } from "../middleware/authMiddleware.js"

const recipeRouter = express.Router()

// Todas las rutas ya están protegidas por el middleware en app.js

recipeRouter.post("/", createRecipe)
recipeRouter.get("/", getRecipes)
recipeRouter.get("/search", searchRecipes)
recipeRouter.get("/:id", getRecipeById)
recipeRouter.put("/:id", updateRecipe)
recipeRouter.delete("/:id", deleteRecipe)

// Rutas solo para admin
recipeRouter.get("/admin/all", authenticateJWT, isAdmin, adminGetAllRecipes)
recipeRouter.get("/admin/:id", authenticateJWT, isAdmin, adminGetRecipeById)
recipeRouter.put("/admin/:id", authenticateJWT, isAdmin, adminUpdateRecipeById)
recipeRouter.delete("/admin/:id", authenticateJWT, isAdmin, adminDeleteRecipeById)

// Rutas de moderación (solo admin)
recipeRouter.get("/moderation/pending", authenticateJWT, isAdmin, getPendingRecipes)
recipeRouter.post("/moderation/:id/approve", authenticateJWT, isAdmin, approveRecipe)
recipeRouter.post("/moderation/:id/reject", authenticateJWT, isAdmin, rejectRecipe)

export { recipeRouter }
