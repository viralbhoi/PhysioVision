import {
    createExercise,
    getExercises,
    getExerciseById,
} from "./exercise.service.js";

import uploadToCloudinary from "../../utils/uploadToCloudinary.js";

const parseConfiguration = (value) => {
    if (value == null || value === "") {
        return {};
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        throw new Error("configuration must contain valid JSON");
    }
};

export const create = async (req, res) => {
    let uploadedVideo;
    let uploadedImage;

    try {
        const videoFile = req.files?.referenceVideo?.[0];
        const imageFile = req.files?.referenceImage?.[0];

        if (videoFile) {
            uploadedVideo = await uploadToCloudinary(
                videoFile,
                "video",
                "physiovision/exercise-videos",
            );
        }

        if (imageFile) {
            uploadedImage = await uploadToCloudinary(
                imageFile,
                "image",
                "physiovision/exercise-images",
            );
        }

        const exercise = await createExercise({
            name: req.body.name,
            description: req.body.description ?? "",
            category: req.body.category,
            trackingMode: req.body.trackingMode,

            referenceVideo:
                uploadedVideo?.url ?? req.body.referenceVideo ?? null,

            referenceVideoPublicId: uploadedVideo?.publicId ?? null,

            referenceImage:
                uploadedImage?.url ?? req.body.referenceImage ?? null,

            referenceImagePublicId: uploadedImage?.publicId ?? null,

            targetHoldSeconds:
                req.body.targetHoldSeconds === "" ||
                req.body.targetHoldSeconds == null
                    ? null
                    : Number(req.body.targetHoldSeconds),

            matchThreshold:
                req.body.matchThreshold === "" ||
                req.body.matchThreshold == null
                    ? undefined
                    : Number(req.body.matchThreshold),

            configuration: parseConfiguration(req.body.configuration),

            physiotherapistId: req.user.userId,
        });

        return res.status(201).json({
            message: "Exercise created successfully",
            exercise,
        });
    } catch (error) {
        // Avoid leaving newly uploaded files orphaned if exercise creation fails.
        const cleanupTasks = [];

        if (uploadedVideo?.publicId) {
            cleanupTasks.push(
                import("../../config/cloudinary.js").then(
                    ({ default: cloudinary }) =>
                        cloudinary.uploader.destroy(uploadedVideo.publicId, {
                            resource_type: "video",
                        }),
                ),
            );
        }

        if (uploadedImage?.publicId) {
            cleanupTasks.push(
                import("../../config/cloudinary.js").then(
                    ({ default: cloudinary }) =>
                        cloudinary.uploader.destroy(uploadedImage.publicId, {
                            resource_type: "image",
                        }),
                ),
            );
        }

        await Promise.allSettled(cleanupTasks);

        const status =
            error.name === "ValidationError" ||
            error.message === "configuration must contain valid JSON"
                ? 400
                : 500;

        return res.status(status).json({
            message: error.message || "Failed to create exercise",
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const exercises = await getExercises();

        return res.status(200).json({ exercises });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to retrieve exercises",
        });
    }
};

export const getOne = async (req, res) => {
    try {
        const exercise = await getExerciseById(req.params.id);

        return res.status(200).json({ exercise });
    } catch (error) {
        const status = error.name === "CastError" ? 400 : 404;

        return res.status(status).json({
            message: error.message || "Exercise not found",
        });
    }
};
