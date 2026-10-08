import Progress from "../../models/Progress.js";
import Patient from "../../models/Patient.js";
import ExerciseSession from "../../models/ExerciseSession.js";
import Physiotherapist from "../../models/Physiotherapist.js";

// =============================================================
// Verify Patient Access
// =============================================================

const verifyPatientAccess = async (physiotherapistUserId, patientId) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new Error("Patient not found");
    }

    /*
     * First check the direct relationship
     * stored on the Patient document.
     */
    if (
        patient.physiotherapist &&
        patient.physiotherapist.toString() === physiotherapistUserId.toString()
    ) {
        return patient;
    }

    /*
     * Patient.physiotherapist stores the
     * Physiotherapist document ID, while
     * req.user.userId is the User document ID.
     *
     * Therefore resolve the physiotherapist
     * profile when the direct check fails.
     */
    const physiotherapist = await Physiotherapist.findOne({
        user: physiotherapistUserId,
    });

    if (!physiotherapist) {
        throw new Error("Physiotherapist profile not found");
    }

    /*
     * Also check the physiotherapist's
     * patients array.
     */
    const hasAccess = physiotherapist.patients.some(
        (id) => id.toString() === patientId.toString(),
    );

    if (!hasAccess) {
        throw new Error("Patient is not assigned to this physiotherapist");
    }

    return patient;
};

// =============================================================
// Get Patient Progress
// =============================================================

export const getPatientProgress = async (physiotherapistUserId, patientId) => {
    const patient = await verifyPatientAccess(physiotherapistUserId, patientId);

    const progress = await Progress.find({
        patient: patient._id,
    })
        .populate("exercise", "name description")
        .sort({
            updatedAt: -1,
        });

    return progress;
};

// =============================================================
// Get Patient Sessions
// =============================================================

export const getPatientSessions = async (physiotherapistUserId, patientId) => {
    const patient = await verifyPatientAccess(physiotherapistUserId, patientId);

    const sessions = await ExerciseSession.find({
        patient: patient._id,
        status: "COMPLETED",
    })
        .populate("exercise", "name description")
        .sort({
            completedAt: -1,
        });

    return sessions;
};
