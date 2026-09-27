import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },

        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },

        totalSessions: {
            type: Number,
            default: 0,
        },

        totalReps: {
            type: Number,
            default: 0,
        },

        averageAccuracy: {
            type: Number,
            default: 0,
        },

        lastAccuracy: {
            type: Number,
            default: 0,
        },

        trend: {
            type: String,
            enum: ["IMPROVING", "STABLE", "DECLINING"],
            default: "STABLE",
        },

        lastSessionAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

progressSchema.index({ patient: 1, exercise: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
