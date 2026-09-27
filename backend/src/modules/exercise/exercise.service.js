import Exercise from "../../models/Exercise.js";

export const createExercise = async ({
    name,
    description,
    referenceVideo,
    configuration,
    physiotherapistId,
}) => {
    const exercise = await Exercise.create({
        name,
        description,
        referenceVideo,
        configuration,
        createdBy: physiotherapistId,
        isCustom: true,
    });

    return exercise;
};

export const getExercises = async () => {
    return await Exercise.find().sort({ createdAt: -1 });
};

export const getExerciseById = async (exerciseId) => {
    const exercise = await Exercise.findById(exerciseId);

    if (!exercise) {
        throw new Error("Exercise not found");
    }

    return exercise;
};
