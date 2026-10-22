import Exercise from "../../models/Exercise.js";

export const createExercise = async ({
    name,
    description,
    category,
    trackingMode,
    referenceVideo,
    referenceVideoPublicId,
    referenceImage,
    referenceImagePublicId,
    targetHoldSeconds,
    matchThreshold,
    configuration,
    physiotherapistId,
}) => {
    const exercise = await Exercise.create({
        name,
        description,
        category,
        trackingMode,
        referenceVideo,
        referenceVideoPublicId,
        referenceImage,
        referenceImagePublicId,
        targetHoldSeconds,
        matchThreshold,
        configuration,
        createdBy: physiotherapistId,
        isCustom: true,
    });

    return exercise;
};

export const getExercises = async () => {
    return Exercise.find().sort({ createdAt: -1 });
};

export const getExerciseById = async (exerciseId) => {
    const exercise = await Exercise.findById(exerciseId);

    if (!exercise) {
        throw new Error("Exercise not found");
    }

    return exercise;
};
