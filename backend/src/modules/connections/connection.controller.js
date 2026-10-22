import {
    createConnectionCode,
    connectPatient,
    getMyPhysiotherapist,
} from "./connection.service.js";

// =============================================================
// Physio: Generate Code
// =============================================================

export const generateCode = async (req, res) => {
    try {
        const connectionCode = await createConnectionCode(req.user.userId);

        res.status(201).json({
            message: "Connection code generated successfully",

            code: connectionCode.code,

            expiresAt: connectionCode.expiresAt,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

// =============================================================
// Patient: Connect
// =============================================================

export const connect = async (req, res) => {
    try {
        const result = await connectPatient(req.user.userId, req.body.code);

        res.status(200).json({
            message: "Successfully connected to physiotherapist",

            physiotherapist: {
                id: result.physiotherapist._id,

                name: result.physiotherapist.user?.name,

                email: result.physiotherapist.user?.email,
            },
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

// =============================================================
// Patient: Get Current Physio
// =============================================================

export const getMine = async (req, res) => {
    try {
        const physiotherapist = await getMyPhysiotherapist(req.user.userId);

        res.status(200).json({
            physiotherapist,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
