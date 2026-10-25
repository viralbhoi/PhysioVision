import {
    createGeneralizedSession,
    getMyGeneralizedSessions,
    updateGeneralizedSessionStatus,
    getPublicSessionDetails,
    joinGeneralizedSession,
} from "./generalizedSession.service.js";

const getUserId = (req) => req.user?.userId;

const handleError = (res, error) => {
    const message = error.message || "Something went wrong.";

    const statusCode =
        message.includes("required") ||
        message.includes("Invalid") ||
        message.includes("must") ||
        message.includes("Select") ||
        message.includes("Enter") ||
        message.includes("Incorrect")
            ? 400
            : message.includes("not found")
              ? 404
              : 500;

    return res.status(statusCode).json({
        success: false,
        message,
    });
};

export const createSession = async (req, res) => {
    try {
        const physioId = req.user?.userId;

        if (!physioId) {
            return res.status(401).json({
                success: false,
                message:
                    "Physiotherapist ID missing from authentication token.",
            });
        }

        const session = await createGeneralizedSession({
            ...req.body,
            createdBy: physioId,
        });

        return res.status(201).json({
            success: true,
            session,
        });
    } catch (error) {
        console.error("CREATE GENERALIZED SESSION ERROR:", error);
        return handleError(res, error);
    }
};

export const getMySessions = async (req, res) => {
    try {
        const sessions = await getMyGeneralizedSessions(getUserId(req));

        return res.status(200).json({
            success: true,
            count: sessions.length,
            sessions,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateSessionStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false.",
            });
        }

        const session = await updateGeneralizedSessionStatus({
            sessionId: req.params.id,
            createdBy: getUserId(req),
            isActive,
        });

        return res.status(200).json({
            success: true,
            message: `Session ${isActive ? "activated" : "closed"} successfully.`,
            session,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getSessionDetails = async (req, res) => {
    try {
        const session = await getPublicSessionDetails(req.params.inviteCode);

        return res.status(200).json({
            success: true,
            session,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const joinSession = async (req, res) => {
    try {
        const result = await joinGeneralizedSession({
            inviteCode: req.params.inviteCode,
            password: req.body.password,
            displayName: req.body.displayName,
        });

        return res.status(200).json({
            success: true,
            message: "You joined the session successfully.",
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
