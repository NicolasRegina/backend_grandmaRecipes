import Group from "../models/groupModel.js"
import User from "../models/userModel.js"

// ========== SISTEMA DE INVITACIONES ==========
// Buscar grupo por código de invitación
export const findGroupByInviteCode = async (req, res) => {
    try {
        const { code } = req.params;
        const group = await Group.findOne({ inviteCode: code.toUpperCase() })
            .populate("creator", "name profilePicture")
            .select("name description image isPrivate inviteCode creator members pendingRequests");

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado con ese código" });
        }

        // Verificar si el usuario ya es miembro
        const isMember = group.members.some(member => member.user.toString() === req.user.id);
        
        // Verificar si ya tiene solicitud pendiente
        const hasPendingRequest = group.pendingRequests?.some(request => request.user.toString() === req.user.id);

        res.status(200).json({
            group: {
                ...group.toObject(),
                isMember,
                hasPendingRequest
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Solicitar unirse a un grupo
export const requestJoinGroup = async (req, res) => {
    try {
        const { code } = req.params;
        const group = await Group.findOne({ inviteCode: code.toUpperCase() })
            .populate("members.user", "_id name email");

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }

        // Verificar si ya es miembro (compatible con populate y sin populate)
        const isMember = group.members.some(member => {
            const memberId = member.user._id || member.user;
            return memberId.toString() === req.user.id;
        });

        if (isMember) {
            return res.status(400).json({ message: "Ya eres miembro de este grupo" });
        }

        // Verificar si ya tiene solicitud pendiente
        const hasPendingRequest = group.pendingRequests.some(request => request.user.toString() === req.user.id);
        if (hasPendingRequest) {
            return res.status(400).json({ message: "Ya tienes una solicitud pendiente para este grupo" });
        }

        // Si el grupo es público, unirse automáticamente
        if (!group.isPrivate) {
            group.members.push({
                user: req.user.id,
                role: "member",
                joinedAt: new Date()
            });
            
            await group.save();
            await User.findByIdAndUpdate(req.user.id, { $push: { groups: group._id } });
            
            return res.status(200).json({ message: "Te has unido al grupo exitosamente" });
        }

        // Si es privado, agregar a solicitudes pendientes
        group.pendingRequests.push({
            user: req.user.id,
            requestedAt: new Date()
        });

        await group.save();
        res.status(200).json({ message: "Solicitud enviada. Espera la aprobación del administrador." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Aprobar solicitud de unirse
export const approveJoinRequest = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }

        // Verificar permisos (owner o admin pueden aprobar)
        const member = group.members.find(member => member.user.toString() === req.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
            return res.status(403).json({ message: "No tienes permiso para aprobar solicitudes" });
        }

        // Verificar que existe la solicitud
        const requestIndex = group.pendingRequests.findIndex(request => request.user.toString() === userId);
        if (requestIndex === -1) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        // Aprobar: mover de pendientes a miembros
        group.pendingRequests.splice(requestIndex, 1);
        group.members.push({
            user: userId,
            role: "member",
            joinedAt: new Date()
        });

        await group.save();
        await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

        res.status(200).json({ message: "Solicitud aprobada exitosamente" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Rechazar solicitud de unirse
export const rejectJoinRequest = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }

        // Verificar permisos
        const member = group.members.find(member => member.user.toString() === req.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
            return res.status(403).json({ message: "No tienes permiso para rechazar solicitudes" });
        }

        // Remover la solicitud
        const requestIndex = group.pendingRequests.findIndex(request => request.user.toString() === userId);
        if (requestIndex === -1) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        group.pendingRequests.splice(requestIndex, 1);
        await group.save();

        res.status(200).json({ message: "Solicitud rechazada" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cambiar rol de miembro
export const changeMemberRole = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { role } = req.body;

        if (!["admin", "member"].includes(role)) {
            return res.status(400).json({ message: "Rol inválido" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }

        // Solo el owner puede cambiar roles
        const requestingMember = group.members.find(member => member.user.toString() === req.user.id);
        if (!requestingMember || requestingMember.role !== "owner") {
            return res.status(403).json({ message: "Solo el propietario puede cambiar roles" });
        }

        // Encontrar el miembro a modificar
        const memberIndex = group.members.findIndex(member => member.user.toString() === userId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: "Miembro no encontrado" });
        }

        // No se puede cambiar el rol del owner
        if (group.members[memberIndex].role === "owner") {
            return res.status(400).json({ message: "No se puede cambiar el rol del propietario" });
        }

        group.members[memberIndex].role = role;
        await group.save();

        res.status(200).json({ message: "Rol actualizado exitosamente" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remover miembro del grupo
export const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Grupo no encontrado" });
        }

        // Verificar permisos
        const requestingMember = group.members.find(member => member.user.toString() === req.user.id);
        if (!requestingMember || (requestingMember.role !== "owner" && requestingMember.role !== "admin")) {
            return res.status(403).json({ message: "No tienes permiso para remover miembros" });
        }

        // Encontrar el miembro a remover
        const memberIndex = group.members.findIndex(member => member.user.toString() === userId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: "Miembro no encontrado" });
        }

        // No se puede remover al owner
        if (group.members[memberIndex].role === "owner") {
            return res.status(400).json({ message: "No se puede remover al propietario del grupo" });
        }

        // Solo el owner puede remover admins
        if (group.members[memberIndex].role === "admin" && requestingMember.role !== "owner") {
            return res.status(403).json({ message: "Solo el propietario puede remover administradores" });
        }

        // Remover miembro
        group.members.splice(memberIndex, 1);
        await group.save();

        // Remover grupo de la lista del usuario
        await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });

        res.status(200).json({ message: "Miembro removido exitosamente" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
