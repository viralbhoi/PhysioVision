import {
    createExercise,
    getExercises,
    getExerciseById,
} from "./exercise.service.js";

export const create = async (req, res) => {
    try {
        const exercise = await createExercise({
            ...req.body,
            physiotherapistId: req.user.userId,
        });

        return res.status(201).json({
            message: "Exercise created successfully",
            exercise,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const exercises = await getExercises();

        return res.status(200).json({
            exercises,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getOne = async (req, res) => {
    try {
        const exercise = await getExerciseById(req.params.id);

        return res.status(200).json({
            exercise,
        });
    } catch (error) {
        return res.status(404).json({
            message: error.message,
        });
    }
};
