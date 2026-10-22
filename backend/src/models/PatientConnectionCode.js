import mongoose from "mongoose";

const patientConnectionCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        physiotherapist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Physiotherapist",
            required: true,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "USED", "EXPIRED"],
            default: "ACTIVE",
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        usedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const PatientConnectionCode = mongoose.model(
    "PatientConnectionCode",
    patientConnectionCodeSchema,
);

export default PatientConnectionCode;
