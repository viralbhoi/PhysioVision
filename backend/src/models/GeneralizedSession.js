import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
    {
        participantId: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false },
);

const generalizedSessionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        exercises: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Exercise",
                required: true,
            },
        ],
        inviteCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        participants: {
            type: [participantSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

generalizedSessionSchema.index({
    createdBy: 1,
    createdAt: -1,
});

export default mongoose.models.GeneralizedSession ||
    mongoose.model("GeneralizedSession", generalizedSessionSchema);
