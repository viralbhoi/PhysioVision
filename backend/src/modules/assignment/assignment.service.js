import ExerciseAssignment from "../../models/ExerciseAssignment.js";
import Patient from "../../models/Patient.js";
import Physiotherapist from "../../models/Physiotherapist.js";

export const assignExercise = async ({
    physiotherapistUserId,
    patientId,
    exerciseId,
    sets,
    targetReps,
    notes,
}) => {
    const physiotherapist = await Physiotherapist.findOne({
        user: physiotherapistUserId,
    });

    if (!physiotherapist) {
        throw new Error("Physiotherapist profile not found");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new Error("Patient not found");
    }

    const assignment = await ExerciseAssignment.create({
        patient: patient._id,
        physiotherapist: physiotherapist._id,
        exercise: exerciseId,
        sets,
        targetReps,
        notes,
    });

    // Connect patient with physiotherapist
    patient.physiotherapist = physiotherapist._id;
    await patient.save();

    // Add patient to physiotherapist's patient list
    if (
        !physiotherapist.patients.some(
            (id) => id.toString() === patient._id.toString(),
        )
    ) {
        physiotherapist.patients.push(patient._id);
        await physiotherapist.save();
    }

    return assignment;
};

export const getPatientAssignments = async (userId) => {
    const patient = await Patient.findOne({
        user: userId,
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    return await ExerciseAssignment.find({
        patient: patient._id,
        status: {
            $in: ["ASSIGNED", "IN_PROGRESS", "PAUSED"],
        },
    })
        .populate("exercise")
        .populate("physiotherapist");
};

export const getPhysioAssignments = async (userId) => {
    const physiotherapist = await Physiotherapist.findOne({
        user: userId,
    });

    if (!physiotherapist) {
        throw new Error("Physiotherapist profile not found");
    }

    return await ExerciseAssignment.find({
        physiotherapist: physiotherapist._id,
    })
        .populate({
            path: "patient",
            populate: {
                path: "user",
                select: "name email",
            },
        })
        .populate("exercise");
};
