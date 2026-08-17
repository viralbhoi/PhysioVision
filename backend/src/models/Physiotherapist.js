import mongoose from "mongoose";

const physiotherapistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        patients: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Patient",
            },
        ],
    },
    {
        timestamps: true,
    },
);

const Physiotherapist = mongoose.model(
    "Physiotherapist",
    physiotherapistSchema,
);

export default Physiotherapist;
