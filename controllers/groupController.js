import Group from "../models/groupModel.js"
import User from "../models/userModel.js"
import Recipe from "../models/recipeModel.js"
import { validateGroup } from "../validation/validation.js"

// Crear un nuevo grupo
export const createGroup = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateGroup(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Crear nuevo grupo
        const group = new Group({
            ...req.body,
            creator: req.user.id,
            members: [{ user: req.user.id, role: "admin" }],
        })

        // Guardar grupo
        const savedGroup = await group.save()

        // Actualizar el usuario para incluir el grupo
        await User.findByIdAndUpdate(req.user.id, { $push: { groups: savedGroup._id } })

        res.status(201).json({
            message: "Grupo creado exitosamente",
            group: savedGroup,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Obtener todos los grupos del usuario
export const getGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            "members.user": req.user.id,
        }).populate("creator", "name profilePicture")

        res.status(200).json(groups)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Obtener un grupo por ID
export const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate("creator", "name profilePicture")
            .populate("members.user", "name profilePicture email")

        if (!group) return res.status(404).json({ message: "Grupo no encontrado" })

        // Verificar si el usuario es miembro del grupo
        const isMember = group.members.some((member) => member.user._id.toString() === req.user.id)

        if (!isMember && group.isPrivate) {
            return res.status(403).json({ message: "No tienes permiso para ver este grupo" })
        }

        res.status(200).json(group)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Actualizar un grupo
export const updateGroup = async (req, res) => {
    try {
        // Buscar el grupo
        const group = await Group.findById(req.params.id)
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" })

        // Verificar si el usuario es administrador del grupo
        const member = group.members.find((member) => member.user.toString() === req.user.id)

        if (!member || member.role !== "admin") {
            return res.status(403).json({ message: "No tienes permiso para actualizar este grupo" })
        }

        // Actualizar grupo
        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                image: req.body.image,
                isPrivate: req.body.isPrivate,
            },
            { new: true },
        )

        res.status(200).json({
            message: "Grupo actualizado exitosamente",
            group: updatedGroup,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Eliminar un grupo
export const deleteGroup = async (req, res) => {
    try {
        // Buscar el grupo
        const group = await Group.findById(req.params.id)
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" })

        // Verificar si el usuario es el creador del grupo
        if (group.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: "Solo el creador puede eliminar el grupo" })
        }

        // Eliminar el grupo
        await Group.findByIdAndDelete(req.params.id)

        // Actualizar los usuarios para quitar el grupo
        await User.updateMany({ groups: req.params.id }, { $pull: { groups: req.params.id } })

        // Actualizar las recetas para quitar la referencia al grupo
        await Recipe.updateMany({ group: req.params.id }, { $unset: { group: "" } })

        res.status(200).json({ message: "Grupo eliminado exitosamente" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}