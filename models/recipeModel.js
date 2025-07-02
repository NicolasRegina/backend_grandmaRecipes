import mongoose from "mongoose"

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: String,
        required: true,
        trim: true,
    },
    unit: {
        type: String,
        trim: true,
    },
})

const stepSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
})

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 500,
        },
        ingredients: [ingredientSchema],
        steps: [stepSchema],
        prepTime: {
            type: Number,
            required: true,
            min: 1,
        },
        cookTime: {
            type: Number,
            required: true,
            min: 0,
        },
        servings: {
            type: Number,
            required: true,
            min: 1,
        },
        difficulty: {
            type: String,
            required: true,
            enum: ["Fácil", "Media", "Difícil"],
        },
        category: {
            type: String,
            required: true,
            enum: ["Desayuno", "Almuerzo", "Cena", "Postre", "Merienda", "Bebida", "Otro"],
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        image: {
            type: String,
            default: "/img/default-recipe.jpg",
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
)

// Índices para búsquedas eficientes
recipeSchema.index({ title: "text", description: "text", tags: "text" })

export default mongoose.model("Recipe", recipeSchema)
