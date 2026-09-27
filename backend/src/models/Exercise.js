import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        referenceVideo: {
            type: String,
            default: null,
        },

        configuration: {
            primaryJoints: {
                type: [String],
                default: [],
            },

            allJoints: {
                type: mongoose.Schema.Types.Mixed,
                default: {},
            },

            tolerance: {
                type: Number,
                default: 15,
            },

            goldenTrajectory: {
                type: [mongoose.Schema.Types.Mixed],
                default: [],
            },
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Physiotherapist",
            default: null,
        },

        isCustom: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;
