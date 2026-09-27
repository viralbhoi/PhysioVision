import {
    createSession,
    completeSession,
    getPatientSessions,
} from "./session.service.js";

export const start = async (req, res) => {
    try {
        const session = await createSession({
            userId: req.user.userId,
            assignmentId: req.body.assignmentId,
        });

        return res.status(201).json({
            message: "Exercise session started",
            session,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};

export const complete = async (req, res) => {
    try {
        const session = await completeSession({
            userId: req.user.userId,
            sessionId: req.params.id,
            ...req.body,
        });

        return res.status(200).json({
            message: "Exercise session completed",
            session,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};

export const getMine = async (req, res) => {
    try {
        const sessions = await getPatientSessions(req.user.userId);

        return res.status(200).json({
            sessions,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
