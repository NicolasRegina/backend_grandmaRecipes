import Recipe from "../models/recipeModel.js"
import { validateRecipe } from "../validation/validation.js"

// ========== ADMIN: CRUD RECETAS ==========
// Listar todas las recetas (admin)
export const adminGetAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate("author", "name")
            .populate("group", "name");
        res.status(200).json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Obtener receta por ID (admin)
export const adminGetRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id)
            .populate("author", "name")
            .populate("group", "name");
        if (!recipe) return res.status(404).json({ message: "Receta no encontrada" });
        res.status(200).json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Actualizar receta por ID (admin)
export const adminUpdateRecipeById = async (req, res) => {
    try {
        const { error } = validateRecipe(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });
        const updatedRecipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedRecipe) return res.status(404).json({ message: "Receta no encontrada" });
        res.status(200).json({ message: "Receta actualizada", recipe: updatedRecipe });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Eliminar receta por ID (admin)
export const adminDeleteRecipeById = async (req, res) => {
    try {
        const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!deletedRecipe) return res.status(404).json({ message: "Receta no encontrada" });
        res.status(200).json({ message: "Receta eliminada" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ========== FUNCIONES DE MODERACIÓN ==========

// Obtener recetas pendientes de moderación (solo admin)
export const getPendingRecipes = async (req, res) => {
    try {
        const pendingRecipes = await Recipe.find({ moderationStatus: "pending" })
            .populate("author", "name email profilePicture")
            .populate("group", "name")
            .sort({ createdAt: -1 })

        res.status(200).json(pendingRecipes)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Aprobar receta (solo admin)
export const approveRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            {
                moderationStatus: "approved",
                moderatedBy: req.user.id,
                moderatedAt: new Date()
            },
            { new: true }
        ).populate("author", "name email")

        if (!recipe) {
            return res.status(404).json({ message: "Receta no encontrada" })
        }

        res.status(200).json({ message: "Receta aprobada exitosamente", recipe })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Rechazar receta (solo admin)
export const rejectRecipe = async (req, res) => {
    try {
        const { rejectionReason } = req.body

        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            {
                moderationStatus: "rejected",
                moderatedBy: req.user.id,
                moderatedAt: new Date(),
                rejectionReason: rejectionReason || "No cumple con las políticas de la plataforma"
            },
            { new: true }
        ).populate("author", "name email")

        if (!recipe) {
            return res.status(404).json({ message: "Receta no encontrada" })
        }

        res.status(200).json({ message: "Receta rechazada", recipe })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// ========== USER: CRUD RECETAS ==========

// Crear una nueva receta
export const createRecipe = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateRecipe(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Crear nueva receta
        const recipeData = {
            ...req.body,
            author: req.user.id,
        }

        // Si es admin, auto-aprobar la receta
        if (req.user.role === "admin") {
            recipeData.moderationStatus = "approved"
            recipeData.moderatedBy = req.user.id
            recipeData.moderatedAt = new Date()
        }

        const recipe = new Recipe(recipeData)

        // Guardar receta
        const savedRecipe = await recipe.save()

        // Populate los campos necesarios para el frontend
        await savedRecipe.populate('author', 'name')
        await savedRecipe.populate('group', 'name')

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
        let filter = {};

        // Si el usuario es admin, ve todas las recetas
        if (req.user.role === "admin") {
            filter = {}; // Sin filtro - ve todo
        } else {
            // Usuario normal: ve recetas públicas aprobadas + todas sus propias recetas (cualquier estado)
            filter = {
                $or: [
                    { 
                        isPrivate: false,
                        moderationStatus: "approved" // Solo recetas públicas aprobadas
                    },
                    { author: req.user.id } // Sus propias recetas (independiente del estado)
                ]
            };
        }

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

        // Verificar permisos para ver recetas privadas o pendientes de moderación
        if (recipe.isPrivate) {
            const isAuthor = recipe.author._id.toString() === req.user.id
            const isGroupMember = recipe.group && req.user.groups.includes(recipe.group._id)

            if (!isAuthor && !isGroupMember && req.user.role !== "admin") {
                return res.status(403).json({ message: "No tienes permiso para ver esta receta" })
            }
        }

        // Verificar si la receta está pendiente de moderación
        if (recipe.moderationStatus !== "approved") {
            const isAuthor = recipe.author._id.toString() === req.user.id
            
            if (!isAuthor && req.user.role !== "admin") {
                return res.status(403).json({ message: "Esta receta está pendiente de aprobación" })
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

        // Verificar permisos (solo el autor o un admin pueden actualizar)
        if (recipe.author.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "No tienes permiso para actualizar esta receta" })
        }

        // Preparar datos de actualización
        const updateData = { ...req.body }

        // Si no es admin y está editando, resetear estado de moderación
        if (req.user.role !== "admin") {
            updateData.moderationStatus = "pending"
            updateData.moderatedBy = null
            updateData.moderatedAt = null
            updateData.rejectionReason = null
        }

        // Actualizar receta
        const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate("author", "name")
            .populate("group", "name")

        const message = req.user.role === "admin" 
            ? "Receta actualizada exitosamente"
            : "Receta actualizada exitosamente. Está pendiente de aprobación nuevamente."

        res.status(200).json({
            message,
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

        // Verificar permisos (solo el autor o un admin pueden eliminar)
        if (recipe.author.toString() !== req.user.id && req.user.role !== "admin") {
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

        // Filtro base de privacidad y moderación
        let filter = {};

        // Si el usuario es admin, ve todas las recetas
        if (req.user.role === "admin") {
            filter = {}; // Sin filtro - ve todo
        } else {
            // Usuario normal: solo ve recetas públicas aprobadas o propias
            filter = {
                $or: [
                    { 
                        isPrivate: false,
                        moderationStatus: "approved" // Solo recetas públicas aprobadas
                    },
                    { author: req.user.id } // Sus propias recetas (independiente del estado)
                ]
            };
        }

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