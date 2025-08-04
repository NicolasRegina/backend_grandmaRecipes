import jwt from "jsonwebtoken"
import User from "../models/userModel.js"
import { validateUser, validateLogin, validateUserByAdmin } from "../validation/validation.js"

// Registrar un nuevo usuario
export const registerUser = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateUser(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Verificar si el email ya existe
        const emailExists = await User.findOne({ email: req.body.email })
        if (emailExists) return res.status(400).json({ message: "El email ya está registrado" })

        // Crear nuevo usuario con rol user por defecto
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            bio: req.body.bio || "",
            role: "user",
        })

        // Guardar usuario
        const savedUser = await user.save()

        // Generar token
        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: "24h" })

        // Responder sin incluir la contraseña
        const { password, ...userWithoutPassword } = savedUser.toObject()

        res.status(201).json({
            message: "Usuario registrado exitosamente",
            user: userWithoutPassword,
            token,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Login de usuario
export const loginUser = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateLogin(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Buscar usuario por email
        const user = await User.findOne({ email: req.body.email })
        if (!user) return res.status(400).json({ message: "Email o contraseña incorrectos" })

        // Verificar contraseña
        const validPassword = await user.comparePassword(req.body.password)
        if (!validPassword) return res.status(400).json({ message: "Email o contraseña incorrectos" })

        // Generar token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" })

        res.status(200).json({
            message: "Login exitoso",
            token,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Obtener perfil de usuario
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password")
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" })

        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Actualizar perfil de usuario
export const updateUserProfile = async (req, res) => {
    try {
        // No permitir actualizar email o contraseña por esta ruta
        const { name, bio, profilePicture } = req.body

        const updatedUser = await User.findByIdAndUpdate(req.user.id, { name, bio, profilePicture }, { new: true }).select(
            "-password",
        )

        if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" })

        res.status(200).json({
            message: "Perfil actualizado exitosamente",
            user: updatedUser,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// ========== ADMIN: CRUD USUARIOS ==========
// Listar todos los usuarios
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Actualizar usuario por ID
export const updateUserById = async (req, res) => {
    try {
        const { name, bio, profilePicture, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, bio, profilePicture, role },
            { new: true }
        ).select("-password");
        if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" });
        res.status(200).json({ message: "Usuario actualizado", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Eliminar usuario por ID
export const deleteUserById = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "Usuario no encontrado" });
        res.status(200).json({ message: "Usuario eliminado" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Registrar un nuevo usuario (solo admin puede crear otros admin)
export const registerUserByAdmin = async (req, res) => {
    try {
        // Validar datos de entrada
        const { error } = validateUserByAdmin(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })

        // Verificar si el email ya existe
        const emailExists = await User.findOne({ email: req.body.email })
        if (emailExists) return res.status(400).json({ message: "El email ya está registrado" })

        // Solo un admin puede crear otro admin
        let role = req.body.role || "user";
        if (req.body.role === "admin") {
            if (!req.user || req.user.role !== "admin") {
                return res.status(403).json({ message: "Solo un administrador puede crear otros administradores." });
            }
            role = "admin";
        }

        // Crear nuevo usuario
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            bio: req.body.bio || "",
            role,
        })

        // Guardar usuario
        const savedUser = await user.save()

        // Responder sin incluir la contraseña
        const { password, ...userWithoutPassword } = savedUser.toObject()

        res.status(201).json({
            message: "Usuario registrado exitosamente",
            user: userWithoutPassword,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
};
