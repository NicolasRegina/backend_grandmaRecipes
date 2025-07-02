import Joi from "joi"

// Validación para registro de usuario
export const validateUser = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required().messages({
            "string.min": "El nombre debe tener al menos 2 caracteres",
            "string.max": "El nombre no puede tener más de 50 caracteres",
            "any.required": "El nombre es obligatorio",
        }),
        email: Joi.string().email().required().messages({
            "string.email": "El email debe ser válido",
            "any.required": "El email es obligatorio",
        }),
        password: Joi.string().min(6).required().messages({
            "string.min": "La contraseña debe tener al menos 6 caracteres",
            "any.required": "La contraseña es obligatoria",
        }),
        bio: Joi.string().max(200).allow("").optional(),
        profilePicture: Joi.string().allow("").optional(),
    })

    return schema.validate(data)
}

// Validación para login
export const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            "string.email": "El email debe ser válido",
            "any.required": "El email es obligatorio",
        }),
        password: Joi.string().required().messages({
            "any.required": "La contraseña es obligatoria",
        }),
    })

    return schema.validate(data)
}

// Validación para recetas
export const validateRecipe = (data) => {
    const ingredientSchema = Joi.object({
        name: Joi.string().required().messages({
            "any.required": "El nombre del ingrediente es obligatorio",
        }),
        quantity: Joi.string().required().messages({
            "any.required": "La cantidad del ingrediente es obligatoria",
        }),
        unit: Joi.string().allow("").optional(),
    })

    const stepSchema = Joi.object({
        number: Joi.number().required().messages({
            "any.required": "El número del paso es obligatorio",
        }),
        description: Joi.string().required().messages({
            "any.required": "La descripción del paso es obligatoria",
        }),
    })

    const schema = Joi.object({
        title: Joi.string().min(3).max(100).required().messages({
            "string.min": "El título debe tener al menos 3 caracteres",
            "string.max": "El título no puede tener más de 100 caracteres",
            "any.required": "El título es obligatorio",
        }),
        description: Joi.string().min(10).max(500).required().messages({
            "string.min": "La descripción debe tener al menos 10 caracteres",
            "string.max": "La descripción no puede tener más de 500 caracteres",
            "any.required": "La descripción es obligatoria",
        }),
        ingredients: Joi.array().items(ingredientSchema).min(1).required().messages({
            "array.min": "Debe incluir al menos un ingrediente",
            "any.required": "Los ingredientes son obligatorios",
        }),
        steps: Joi.array().items(stepSchema).min(1).required().messages({
            "array.min": "Debe incluir al menos un paso",
            "any.required": "Los pasos son obligatorios",
        }),
        prepTime: Joi.number().min(1).required().messages({
            "number.min": "El tiempo de preparación debe ser al menos 1 minuto",
            "any.required": "El tiempo de preparación es obligatorio",
        }),
        cookTime: Joi.number().min(0).required().messages({
            "number.min": "El tiempo de cocción no puede ser negativo",
            "any.required": "El tiempo de cocción es obligatorio",
        }),
        servings: Joi.number().min(1).required().messages({
            "number.min": "Las porciones deben ser al menos 1",
            "any.required": "Las porciones son obligatorias",
        }),
        difficulty: Joi.string().valid("Fácil", "Media", "Difícil").required().messages({
            "any.only": "La dificultad debe ser Fácil, Media o Difícil",
            "any.required": "La dificultad es obligatoria",
        }),
        category: Joi.string()
            .valid("Desayuno", "Almuerzo", "Cena", "Postre", "Merienda", "Bebida", "Otro")
            .required()
            .messages({
                "any.only": "La categoría debe ser válida",
                "any.required": "La categoría es obligatoria",
            }),
        tags: Joi.array().items(Joi.string()).optional(),
        image: Joi.string().allow("").optional(),
        group: Joi.string().allow(null, "").optional(),
        isPrivate: Joi.boolean().optional(),
    })

    return schema.validate(data)
}

// Validación para grupos
export const validateGroup = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required().messages({
            "string.min": "El nombre debe tener al menos 3 caracteres",
            "string.max": "El nombre no puede tener más de 50 caracteres",
            "any.required": "El nombre es obligatorio",
        }),
        description: Joi.string().min(10).max(300).required().messages({
            "string.min": "La descripción debe tener al menos 10 caracteres",
            "string.max": "La descripción no puede tener más de 300 caracteres",
            "any.required": "La descripción es obligatoria",
        }),
        image: Joi.string().allow("").optional(),
        isPrivate: Joi.boolean().optional(),
    })

    return schema.validate(data)
}
