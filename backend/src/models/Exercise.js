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

        // PHYSIOTHERAPY = existing rehab exercise
        // YOGA = yoga exercise
        category: {
            type: String,
            enum: ["PHYSIOTHERAPY", "YOGA"],
            default: "PHYSIOTHERAPY",
            index: true,
        },

        // DYNAMIC = movement / repetition tracking
        // STATIC = hold a reference pose
        trackingMode: {
            type: String,
            enum: ["DYNAMIC", "STATIC"],
            default: "DYNAMIC",
        },

        referenceVideo: {
            type: String,
            default: null,
        },

        referenceVideoPublicId: {
            type: String,
            default: null,
        },

        referenceImage: {
            type: String,
            default: null,
        },

        referenceImagePublicId: {
            type: String,
            default: null,
        },

        targetHoldSeconds: {
            type: Number,
            min: 1,
            default: null,
        },

        matchThreshold: {
            type: Number,
            min: 1,
            max: 100,
            default: 75,
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

            // Used by static yoga pose matching.
            referencePose: {
                type: mongoose.Schema.Types.Mixed,
                default: null,
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
