import mongoose from "mongoose";

const repetitionSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: true,
        },

        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        duration: {
            type: Number,
            default: 0,
        },
    },
    { _id: false },
);

const exerciseSessionSchema = new mongoose.Schema(
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

        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExerciseAssignment",
            required: true,
        },

        startedAt: {
            type: Date,
            required: true,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        duration: {
            type: Number,
            default: 0,
        },

        targetReps: {
            type: Number,
            required: true,
        },

        completedReps: {
            type: Number,
            default: 0,
        },

        averageScore: {
            type: Number,
            default: 0,
        },

        repScores: {
            type: [Number],
            default: [],
        },

        // Static yoga session metrics. These remain unused for dynamic sessions.
        targetHoldSeconds: {
            type: Number,
            min: 0,
            default: 0,
        },

        holdDuration: {
            type: Number,
            min: 0,
            default: 0,
        },

        poseMatchScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        holdCompleted: {
            type: Boolean,
            default: false,
        },

        validScoreFrames: {
            type: Number,
            min: 0,
            default: 0,
        },

        repetitions: {
            type: [repetitionSchema],
            default: [],
        },

        status: {
            type: String,
            enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
            default: "IN_PROGRESS",
        },
    },
    {
        timestamps: true,
    },
);

const ExerciseSession = mongoose.model(
    "ExerciseSession",
    exerciseSessionSchema,
);

export default ExerciseSession;
