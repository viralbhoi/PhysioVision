import {
    assignExercise,
    getPatientAssignments,
    getPhysioAssignments,
} from "./assignment.service.js";

export const assign = async (req, res) => {
    try {
        const assignment = await assignExercise({
            physiotherapistUserId: req.user.userId,
            ...req.body,
        });

        return res.status(201).json({
            message: "Exercise assigned successfully",
            assignment,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};

export const getMyAssignments = async (req, res) => {
    try {
        const assignments = await getPatientAssignments(req.user.userId);

        return res.status(200).json({
            assignments,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};

export const getAssignments = async (req, res) => {
    try {
        const assignments = await getPhysioAssignments(req.user.userId);

        return res.status(200).json({
            assignments,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
