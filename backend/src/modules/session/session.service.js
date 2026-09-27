import ExerciseSession from "../../models/ExerciseSession.js";
import ExerciseAssignment from "../../models/ExerciseAssignment.js";
import Patient from "../../models/Patient.js";

import SessionAnalysis from "../../models/SessionAnalysis.js";
import Progress from "../../models/Progress.js";

export const createSession = async ({ userId, assignmentId }) => {
    const patient = await Patient.findOne({
        user: userId,
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    const assignment = await ExerciseAssignment.findOne({
        _id: assignmentId,
        patient: patient._id,
    }).populate("exercise");

    if (!assignment) {
        throw new Error("Exercise assignment not found");
    }

    const session = await ExerciseSession.create({
        patient: patient._id,
        exercise: assignment.exercise._id,
        assignment: assignment._id,
        startedAt: new Date(),
        targetReps: assignment.targetReps,
    });

    assignment.status = "IN_PROGRESS";
    await assignment.save();

    return session;
};

export const completeSession = async ({
    userId,
    sessionId,
    completedReps,
    averageScore,
    repScores,
    duration,
}) => {
    const patient = await Patient.findOne({
        user: userId,
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    const session = await ExerciseSession.findOne({
        _id: sessionId,
        patient: patient._id,
    });

    if (!session) {
        throw new Error("Session not found");
    }

    // ==========================================
    // Save session
    // ==========================================

    session.completedAt = new Date();

    session.duration = duration || 0;

    session.completedReps = completedReps || 0;

    session.averageScore = averageScore || 0;

    session.repScores = repScores || [];

    session.status = "COMPLETED";

    await session.save();

    // ==========================================
    // Session Analysis
    // ==========================================

    await SessionAnalysis.findOneAndUpdate(
        {
            session: session._id,
        },
        {
            session: session._id,
            patient: patient._id,
            exercise: session.exercise,

            accuracy: averageScore || 0,

            formConsistency: averageScore || 0,

            completedReps: completedReps || 0,

            averageRepScore: averageScore || 0,

            summary: `Completed ${completedReps || 0} repetitions with an average score of ${Math.round(averageScore || 0)}.`,
        },
        {
            upsert: true,
            new: true,
        },
    );

    // ==========================================
    // Progress
    // ==========================================

    let progress = await Progress.findOne({
        patient: patient._id,
        exercise: session.exercise,
    });

    if (!progress) {
        progress = await Progress.create({
            patient: patient._id,
            exercise: session.exercise,
            totalSessions: 1,
            totalReps: completedReps || 0,
            averageAccuracy: averageScore || 0,
            lastAccuracy: averageScore || 0,
            trend: "STABLE",
            lastSessionAt: new Date(),
        });
    } else {
        const oldSessions = progress.totalSessions;

        const newSessions = oldSessions + 1;

        const oldAverage = progress.averageAccuracy;

        const newAverage =
            (oldAverage * oldSessions + (averageScore || 0)) / newSessions;

        // Simple trend calculation
        if ((averageScore || 0) > progress.lastAccuracy + 5) {
            progress.trend = "IMPROVING";
        } else if ((averageScore || 0) < progress.lastAccuracy - 5) {
            progress.trend = "DECLINING";
        } else {
            progress.trend = "STABLE";
        }

        progress.totalSessions = newSessions;

        progress.totalReps += completedReps || 0;

        progress.averageAccuracy = newAverage;

        progress.lastAccuracy = averageScore || 0;

        progress.lastSessionAt = new Date();

        await progress.save();
    }

    // ==========================================
    // Assignment
    // ==========================================

    await ExerciseAssignment.findByIdAndUpdate(session.assignment, {
        status: "COMPLETED",
    });

    return session;
};

export const getPatientSessions = async (userId) => {
    const patient = await Patient.findOne({
        user: userId,
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    return ExerciseSession.find({
        patient: patient._id,
    })
        .populate("exercise", "name")
        .sort({ createdAt: -1 });
};
