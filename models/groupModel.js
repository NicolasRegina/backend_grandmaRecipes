import mongoose from "mongoose"

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 50,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 300,
        },
        image: {
            type: String,
            default: "/img/default-group.jpg",
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                role: {
                    type: String,
                    enum: ["owner", "admin", "member"],
                    default: "member",
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isPrivate: {
            type: Boolean,
            default: true,
        },
        inviteCode: {
            type: String,
            unique: true,
            required: true,
            uppercase: true,
            minlength: 6,
            maxlength: 8,
        },
        pendingRequests: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                requestedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Estado de moderación
        moderationStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending", // Los nuevos grupos van a moderación
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        moderatedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
)

// Middleware para asegurarse de que el creador sea miembro y owner
groupSchema.pre("save", function (next) {
    if (this.isNew) {
        const creatorExists = this.members.some((member) => member.user.toString() === this.creator.toString())

        if (!creatorExists) {
            this.members.push({
                user: this.creator,
                role: "owner",
                joinedAt: new Date(),
            })
        }
    }
    next()
})

// Método estático para generar código de invitación único
groupSchema.statics.generateInviteCode = async function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let exists;
    
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        exists = await this.findOne({ inviteCode: code });
    } while (exists);
    
    return code;
};

export default mongoose.model("Group", groupSchema)
