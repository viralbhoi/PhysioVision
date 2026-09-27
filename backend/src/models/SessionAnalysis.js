import mongoose from "mongoose";

const sessionAnalysisSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExerciseSession",
            required: true,
            unique: true,
        },

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

        accuracy: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        formConsistency: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        completedReps: {
            type: Number,
            default: 0,
        },

        averageRepScore: {
            type: Number,
            default: 0,
        },

        summary: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

const SessionAnalysis = mongoose.model(
    "SessionAnalysis",
    sessionAnalysisSchema,
);

export default SessionAnalysis;
