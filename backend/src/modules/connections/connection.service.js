import crypto from "crypto";

import PatientConnectionCode from "../../models/PatientConnectionCode.js";
import Physiotherapist from "../../models/Physiotherapist.js";
import Patient from "../../models/Patient.js";

// =============================================================
// Generate Unique Connection Code
// =============================================================

const generateCode = () => {
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();

    return `PV-${randomPart}`;
};

// =============================================================
// Generate Connection Code
// =============================================================

export const createConnectionCode = async (userId) => {
    const physiotherapist = await Physiotherapist.findOne({
        user: userId,
    });

    if (!physiotherapist) {
        throw new Error("Physiotherapist profile not found");
    }

    /*
     * Expire previous active codes for
     * this physiotherapist.
     */
    await PatientConnectionCode.updateMany(
        {
            physiotherapist: physiotherapist._id,
            status: "ACTIVE",
        },
        {
            status: "EXPIRED",
        },
    );

    let code;
    let exists = true;

    while (exists) {
        code = generateCode();

        exists = await PatientConnectionCode.exists({
            code,
        });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const connectionCode = await PatientConnectionCode.create({
        code,
        physiotherapist: physiotherapist._id,
        status: "ACTIVE",
        expiresAt,
    });

    return connectionCode;
};

// =============================================================
// Connect Patient
// =============================================================

export const connectPatient = async (userId, inputCode) => {
    const patient = await Patient.findOne({
        user: userId,
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    if (patient.physiotherapist) {
        throw new Error("Patient is already connected to a physiotherapist");
    }

    const code = inputCode?.trim().toUpperCase();

    if (!code) {
        throw new Error("Connection code is required");
    }

    const connectionCode = await PatientConnectionCode.findOne({
        code,
        status: "ACTIVE",
    }).populate({
        path: "physiotherapist",
        populate: {
            path: "user",
            select: "name email",
        },
    });

    if (!connectionCode) {
        throw new Error("Invalid or expired connection code");
    }

    if (connectionCode.expiresAt < new Date()) {
        connectionCode.status = "EXPIRED";

        await connectionCode.save();

        throw new Error("Connection code has expired");
    }

    const physiotherapist = connectionCode.physiotherapist;

    if (!physiotherapist) {
        throw new Error("Physiotherapist not found");
    }

    // =====================================================
    // Establish relationship
    // =====================================================

    patient.physiotherapist = physiotherapist._id;

    await patient.save();

    const alreadyExists = physiotherapist.patients.some(
        (id) => id.toString() === patient._id.toString(),
    );

    if (!alreadyExists) {
        physiotherapist.patients.push(patient._id);

        await physiotherapist.save();
    }

    // =====================================================
    // Consume code
    // =====================================================

    connectionCode.status = "USED";

    connectionCode.usedBy = patient._id;

    await connectionCode.save();

    return {
        patient,
        physiotherapist,
    };
};

// =============================================================
// Get Current Physiotherapist
// =============================================================

export const getMyPhysiotherapist = async (userId) => {
    const patient = await Patient.findOne({
        user: userId,
    }).populate({
        path: "physiotherapist",
        populate: {
            path: "user",
            select: "name email",
        },
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    return patient.physiotherapist;
};
