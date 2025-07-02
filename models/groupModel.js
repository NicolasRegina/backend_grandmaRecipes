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
                    enum: ["admin", "member"],
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
    },
    {
        timestamps: true,
    },
)

// Middleware para asegurarse de que el creador sea miembro y admin
groupSchema.pre("save", function (next) {
    if (this.isNew) {
        const creatorExists = this.members.some((member) => member.user.toString() === this.creator.toString())

        if (!creatorExists) {
            this.members.push({
                user: this.creator,
                role: "admin",
                joinedAt: new Date(),
            })
        }
    }
    next()
})

export default mongoose.model("Group", groupSchema)
