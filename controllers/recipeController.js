import Recipe from "../models/recipeModel.js"
import { validateRecipe } from "../validation/validation.js"

// Crear una nueva receta
export const createRecipe = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateRecipe(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Crear nueva receta
        const recipe = new Recipe({
            ...req.body,
            author: req.user.id,
        })

        // Guardar receta
        const savedRecipe = await recipe.save()

        res.status(201).json({
            message: "Receta creada exitosamente",
            recipe: savedRecipe,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Obtener todas las recetas públicas o del usuario
export const getRecipes = async (req, res) => {
    try {
        const filter = {
            $or: [
                { isPrivate: false },
                { author: req.user.id }
            ]
        };

        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Ordenamiento básico
        // Ejemplo: ?sort=title o ?sort=-createdAt (el "-" es descendente)
        const sort = req.query.sort || "-createdAt";

        const recipes = await Recipe.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("author", "name")
            .populate("group", "name");

        const total = await Recipe.countDocuments(filter);

        res.status(200).json({
            recipes,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalRecipes: total,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Obtener una receta por ID
export const getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id)
            .populate("author", "name")
            .populate("group", "name")

        if (!recipe) return res.status(404).json({ message: "Receta no encontrada" })

        // Verificar permisos para ver recetas privadas
        if (recipe.isPrivate) {
            const isAuthor = recipe.author._id.toString() === req.user.id
            const isGroupMember = recipe.group && req.user.groups.includes(recipe.group._id)

            if (!isAuthor && !isGroupMember) {
                return res.status(403).json({ message: "No tienes permiso para ver esta receta" })
            }
        }

        res.status(200).json(recipe)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Actualizar una receta
export const updateRecipe = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateRecipe(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Buscar la receta
        const recipe = await Recipe.findById(req.params.id)
        if (!recipe) return res.status(404).json({ message: "Receta no encontrada" })

        // Verificar permisos (solo el autor puede actualizar)
        if (recipe.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso para actualizar esta receta" })
        }

        // Actualizar receta
        const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true })

        res.status(200).json({
            message: "Receta actualizada exitosamente",
            recipe: updatedRecipe,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Eliminar una receta
export const deleteRecipe = async (req, res) => {
    try {
        // Buscar la receta
        const recipe = await Recipe.findById(req.params.id)
        if (!recipe) return res.status(404).json({ message: "Receta no encontrada" })

        // Verificar permisos (solo el autor puede eliminar)
        if (recipe.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso para eliminar esta receta" })
        }

        // Eliminar receta
        await Recipe.findByIdAndDelete(req.params.id)

        res.status(200).json({ message: "Receta eliminada exitosamente" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Buscar recetas por texto y filtros
export const searchRecipes = async (req, res) => {
    try {
        const { q, category, difficulty } = req.query;

        // Filtro base de privacidad
        const filter = {
            $or: [
                { isPrivate: false }, 
                { author: req.user.id }
            ]
        };

        // búsqueda por texto si se proporciona
        if (q) {
            filter.$text = { $search: q };
        }

        // filtros adicionales
        if (category) {
            filter.category = category;
        }

        if (difficulty) {
            filter.difficulty = difficulty;
        }

        // Si no hay filtros, devolver error
        if (!q && !category && !difficulty) {
            return res.status(400).json({ message: "Se requiere al menos un criterio de búsqueda" });
        }

        const recipes = await Recipe.find(filter)
            .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
            .populate("author", "name")
            .populate("group", "name");

        res.status(200).json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};