import Group from "../models/groupModel.js"
import User from "../models/userModel.js"
import Recipe from "../models/recipeModel.js"
import { validateGroup } from "../validation/validation.js"

// Importar funciones de invitaciones
export { 
    findGroupByInviteCode, 
    requestJoinGroup, 
    approveJoinRequest, 
    rejectJoinRequest,
    changeMemberRole,
    removeMember 
} from "./groupInviteController.js"

// Buscar grupos por nombre (público o propios)
export const searchGroups = async (req, res) => {
    try {
        const { q } = req.query; // query string para búsqueda

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ message: "Parámetro de búsqueda requerido" });
        }

        let searchFilter = {};

        // Si es admin, puede buscar en todos los grupos
        if (req.user.role === "admin") {
            searchFilter = {
                name: { $regex: q, $options: 'i' } // Búsqueda case-insensitive
            };
        } else {
            // Usuario normal: solo grupos públicos aprobados o donde sea miembro
            searchFilter = {
                name: { $regex: q, $options: 'i' },
                moderationStatus: "approved", // Solo grupos aprobados
                $or: [
                    { isPrivate: false }, // Grupos públicos
                    { "members.user": req.user.id } // Grupos donde es miembro
                ]
            };
        }

        const groups = await Group.find(searchFilter)
            .populate("creator", "name profilePicture")
            .select("name description image isPrivate creator members inviteCode")
            .limit(20) // Limitar resultados
            .sort({ name: 1 }); // Ordenar alfabéticamente

        // Agregar información de membresía para cada grupo
        const groupsWithMembership = groups.map(group => {
            const member = group.members.find(m => m.user.toString() === req.user.id);
            return {
                ...group.toObject(),
                userRole: member ? member.role : null,
                isMember: !!member
            };
        });

        res.status(200).json(groupsWithMembership);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Crear un nuevo grupo
export const createGroup = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateGroup(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Generar código de invitación único
        const inviteCode = await Group.generateInviteCode()

        // Crear nuevo grupo
        const groupData = {
            ...req.body,
            creator: req.user.id,
            inviteCode,
            members: [{ user: req.user.id, role: "owner" }],
        }

        // Si es admin, auto-aprobar el grupo
        if (req.user.role === "admin") {
            groupData.moderationStatus = "approved"
            groupData.moderatedBy = req.user.id
            groupData.moderatedAt = new Date()
        }

        const group = new Group(groupData)

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
        let groups;

        // Si el usuario es admin, ve todos los grupos
        if (req.user.role === "admin") {
            groups = await Group.find({})
                .populate("creator", "name profilePicture")
                .select("name description image isPrivate creator members inviteCode createdAt moderationStatus rejectionReason")
        } else {
            // Usuario normal: ve grupos aprobados donde es miembro + grupos públicos aprobados + todos sus propios grupos
            groups = await Group.find({
                $or: [
                    { 
                        moderationStatus: "approved",
                        $or: [
                            { "members.user": req.user.id }, // Grupos aprobados donde es miembro
                            { isPrivate: false } // Grupos públicos aprobados
                        ]
                    },
                    { creator: req.user.id } // Todos sus propios grupos (cualquier estado)
                ]
            })
                .populate("creator", "name profilePicture")
                .select("name description image isPrivate creator members inviteCode createdAt moderationStatus rejectionReason")
        }

        // Agregar información de membresía para cada grupo
        const groupsWithMembership = groups.map(group => {
            const member = group.members.find(m => m.user.toString() === req.user.id);
            return {
                ...group.toObject(),
                userRole: member ? member.role : null,
                isMember: !!member
            };
        });

        res.status(200).json(groupsWithMembership);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Obtener solo los grupos donde el usuario es miembro (para formularios)
export const getUserGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            "members.user": req.user.id,
            moderationStatus: "approved"
        })
            .populate("creator", "name profilePicture")
            .select("name description image isPrivate creator members inviteCode")
            .sort({ name: 1 });

        // Agregar información de rol del usuario
        const groupsWithRole = groups.map(group => {
            const member = group.members.find(m => m.user.toString() === req.user.id);
            return {
                ...group.toObject(),
                userRole: member ? member.role : null
            };
        });

        res.status(200).json(groupsWithRole);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Obtener un grupo por ID
export const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate("creator", "name profilePicture")
            .populate("members.user", "name profilePicture email")
            .populate("pendingRequests.user", "name profilePicture email")

        if (!group) return res.status(404).json({ message: "Grupo no encontrado" })

        // Agregar información del rol del usuario actual
        const currentUserMember = group.members.find((member) => member.user._id.toString() === req.user.id)
        const userRole = currentUserMember ? currentUserMember.role : null
        const isMember = !!currentUserMember

        // Verificar permisos de acceso para grupos privados o pendientes de moderación
        if (!isMember && group.isPrivate && req.user.role !== "admin") {
            return res.status(403).json({ message: "No tienes permiso para ver este grupo" })
        }

        // Verificar si el grupo está pendiente de moderación
        if (group.moderationStatus !== "approved" && !isMember && req.user.role !== "admin") {
            return res.status(403).json({ message: "Este grupo está pendiente de aprobación" })
        }

        // Obtener las recetas asociadas al grupo
        let recipeFilter = { group: req.params.id };
        
        // Si no es admin y no es miembro, solo mostrar recetas aprobadas
        if (req.user.role !== "admin" && !isMember) {
            recipeFilter.moderationStatus = "approved";
        }

        const recipes = await Recipe.find(recipeFilter)
            .populate("author", "name profilePicture")
            .select("title description image author createdAt moderationStatus")
            .sort({ createdAt: -1 })

        res.status(200).json({
            ...group.toObject(),
            userRole,
            isMember,
            recipes
        })
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

        // Verificar permisos: creador del grupo, administrador del grupo, o admin del sistema
        const isCreator = group.creator.toString() === req.user.id
        const member = group.members.find((member) => member.user.toString() === req.user.id)
        const isGroupAdmin = member && member.role === "admin"
        const isSystemAdmin = req.user.role === "admin"

        if (!isCreator && !isGroupAdmin && !isSystemAdmin) {
            return res.status(403).json({ message: "No tienes permiso para actualizar este grupo" })
        }

        // Preparar datos de actualización
        const updateData = {
            name: req.body.name,
            description: req.body.description,
            image: req.body.image,
            isPrivate: req.body.isPrivate,
        }

        // Si no es admin del sistema y está editando, resetear estado de moderación
        if (req.user.role !== "admin") {
            updateData.moderationStatus = "pending"
            updateData.moderatedBy = null
            updateData.moderatedAt = null
            updateData.rejectionReason = null
        }

        // Actualizar grupo
        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true },
        ).populate("creator", "name")

        const message = req.user.role === "admin" 
            ? "Grupo actualizado exitosamente"
            : "Grupo actualizado exitosamente. Está pendiente de aprobación nuevamente."

        res.status(200).json({
            message,
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

        // Verificar si el usuario es el creador del grupo o es un admin del sistema
        if (group.creator.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Solo el creador o un administrador pueden eliminar el grupo" })
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

// ========== FUNCIONES DE MODERACIÓN ==========

// Obtener grupos pendientes de moderación (solo admin)
export const getPendingGroups = async (req, res) => {
    try {
        const pendingGroups = await Group.find({ moderationStatus: "pending" })
            .populate("creator", "name email profilePicture")
            .sort({ createdAt: -1 })

        res.status(200).json(pendingGroups)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Aprobar grupo (solo admin)
export const approveGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            {
                moderationStatus: "approved",
                moderatedBy: req.user.id,
                moderatedAt: new Date()
            },
            { new: true }
        ).populate("creator", "name email")

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" })
        }

        res.status(200).json({ message: "Grupo aprobado exitosamente", group })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Rechazar grupo (solo admin)
export const rejectGroup = async (req, res) => {
    try {
        const { rejectionReason } = req.body

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            {
                moderationStatus: "rejected",
                moderatedBy: req.user.id,
                moderatedAt: new Date(),
                rejectionReason: rejectionReason || "No cumple con las políticas de la plataforma"
            },
            { new: true }
        ).populate("creator", "name email")

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" })
        }

        res.status(200).json({ message: "Grupo rechazado", group })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Funciones de administración
// Obtener todos los grupos (solo admin)
export const adminGetAllGroups = async (req, res) => {
    try {
        const groups = await Group.find({})
            .populate("creator", "name email profilePicture")
            .populate("members.user", "name email profilePicture")
            .sort({ createdAt: -1 })

        res.status(200).json(groups)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Obtener un grupo por ID (solo admin)
export const adminGetGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate("creator", "name email profilePicture")
            .populate("members.user", "name email profilePicture")

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" })
        }

        res.status(200).json(group)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Actualizar un grupo por ID (solo admin)
export const adminUpdateGroupById = async (req, res) => {
    try {
        const { error } = validateGroup(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate("creator", "name email profilePicture")
         .populate("members.user", "name email profilePicture")

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" })
        }

        res.status(200).json({
            message: "Grupo actualizado exitosamente",
            group: group,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Eliminar un grupo por ID (solo admin)
export const adminDeleteGroupById = async (req, res) => {
    try {
        const group = await Group.findByIdAndDelete(req.params.id)

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" })
        }

        // Actualizar los usuarios para quitar el grupo
        await User.updateMany({ groups: req.params.id }, { $pull: { groups: req.params.id } })

        // Actualizar las recetas para quitar la referencia al grupo
        await Recipe.updateMany({ group: req.params.id }, { $unset: { group: "" } })

        res.status(200).json({ message: "Grupo eliminado exitosamente" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}