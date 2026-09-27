import { getPatientProgress, getPatientSessions } from "./progress.service.js";

export const getProgress = async (req, res) => {
    try {
        const progress = await getPatientProgress(
            req.user.userId,
            req.params.patientId,
        );

        res.status(200).json({
            progress,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

export const getSessions = async (req, res) => {
    try {
        const sessions = await getPatientSessions(
            req.user.userId,
            req.params.patientId,
        );

        res.status(200).json({
            sessions,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
