import mongoose from "mongoose";

const exerciseAssignmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },

        physiotherapist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Physiotherapist",
            required: true,
        },

        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },

        sets: {
            type: Number,
            default: 1,
            min: 1,
        },

        targetReps: {
            type: Number,
            required: true,
            min: 1,
        },

        status: {
            type: String,
            enum: ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "PAUSED"],
            default: "ASSIGNED",
        },

        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

const ExerciseAssignment = mongoose.model(
    "ExerciseAssignment",
    exerciseAssignmentSchema,
);

export default ExerciseAssignment;
