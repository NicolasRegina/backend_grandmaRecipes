import express from "express"
import {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    searchRecipes,
} from "../controllers/recipeController.js"

const recipeRouter = express.Router()

// Todas las rutas ya están protegidas por el middleware en app.js

recipeRouter.post("/", createRecipe)
recipeRouter.get("/", getRecipes)
recipeRouter.get("/search", searchRecipes)
recipeRouter.get("/:id", getRecipeById)
recipeRouter.put("/:id", updateRecipe)
recipeRouter.delete("/:id", deleteRecipe)

export { recipeRouter }
