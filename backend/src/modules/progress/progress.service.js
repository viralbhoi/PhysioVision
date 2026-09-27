import Progress from "../../models/Progress.js";
import Patient from "../../models/Patient.js";
import ExerciseSession from "../../models/ExerciseSession.js";

export const getPatientProgress = async (physiotherapistUserId, patientId) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new Error("Patient not found");
    }

    // Make sure this patient belongs
    // to the requesting physiotherapist
    if (
        patient.physiotherapist?.toString() !== physiotherapistUserId.toString()
    ) {
        const Physiotherapist = (
            await import("../../models/Physiotherapist.js")
        ).default;

        const physiotherapist = await Physiotherapist.findOne({
            user: physiotherapistUserId,
        });

        if (
            !physiotherapist ||
            !physiotherapist.patients.some(
                (id) => id.toString() === patientId.toString(),
            )
        ) {
            throw new Error("Patient is not assigned to this physiotherapist");
        }
    }

    const progress = await Progress.find({
        patient: patient._id,
    })
        .populate("exercise", "name description")
        .sort({
            updatedAt: -1,
        });

    return progress;
};

export const getPatientSessions = async (physiotherapistUserId, patientId) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new Error("Patient not found");
    }

    const sessions = await ExerciseSession.find({
        patient: patient._id,
        status: "COMPLETED",
    })
        .populate("exercise", "name")
        .sort({
            completedAt: -1,
        });

    return sessions;
};
