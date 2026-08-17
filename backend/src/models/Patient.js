import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        physiotherapist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Physiotherapist",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
