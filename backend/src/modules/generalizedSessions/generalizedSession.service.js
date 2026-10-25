import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import GeneralizedSession from "../../models/GeneralizedSession.js";

const generateInviteCode = () =>
    crypto.randomBytes(5).toString("hex").toUpperCase();

const generateParticipantId = () => crypto.randomUUID();

const isExpired = (session) =>
    session.expiresAt && new Date(session.expiresAt) <= new Date();

const sanitizeSession = (session) => {
    const data = session.toObject ? session.toObject() : { ...session };

    delete data.passwordHash;

    return data;
};

export const createGeneralizedSession = async ({
    title,
    description = "",
    exercises,
    password,
    expiresAt = null,
    createdBy,
}) => {
    if (!title?.trim()) {
        throw new Error("Session title is required.");
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new Error("Select at least one exercise.");
    }

    if (!password || password.length < 4) {
        throw new Error("Session password must contain at least 4 characters.");
    }

    if (!mongoose.isValidObjectId(createdBy)) {
        throw new Error("Invalid physiotherapist ID.");
    }

    const uniqueExercises = [...new Set(exercises.map(String))];

    if (!uniqueExercises.every(mongoose.isValidObjectId)) {
        throw new Error("One or more exercise IDs are invalid.");
    }

    let parsedExpiry = null;

    if (expiresAt) {
        parsedExpiry = new Date(expiresAt);

        if (Number.isNaN(parsedExpiry.getTime())) {
            throw new Error("Invalid expiry date.");
        }

        if (parsedExpiry <= new Date()) {
            throw new Error("Expiry date must be in the future.");
        }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Retry in the unlikely event of an invite-code collision.
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            const session = await GeneralizedSession.create({
                title: title.trim(),
                description: description.trim(),
                createdBy,
                exercises: uniqueExercises,
                inviteCode: generateInviteCode(),
                passwordHash,
                expiresAt: parsedExpiry,
            });

            return sanitizeSession(session);
        } catch (error) {
            if (error.code !== 11000 || attempt === 4) {
                throw error;
            }
        }
    }

    throw new Error("Could not generate a unique invite code.");
};

export const getMyGeneralizedSessions = async (createdBy) => {
    if (!mongoose.isValidObjectId(createdBy)) {
        throw new Error("Invalid physiotherapist ID.");
    }

    const sessions = await GeneralizedSession.find({ createdBy })
        .select("-passwordHash")
        .populate("exercises")
        .sort({ createdAt: -1 })
        .lean();

    return sessions;
};

export const updateGeneralizedSessionStatus = async ({
    sessionId,
    createdBy,
    isActive,
}) => {
    if (!mongoose.isValidObjectId(sessionId)) {
        throw new Error("Invalid session ID.");
    }

    const session = await GeneralizedSession.findOneAndUpdate(
        { _id: sessionId, createdBy },
        { $set: { isActive } },
        { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!session) {
        throw new Error("Session not found or you do not own it.");
    }

    return sanitizeSession(session);
};

export const getPublicSessionDetails = async (inviteCode) => {
    const session = await GeneralizedSession.findOne({
        inviteCode: inviteCode.toUpperCase(),
    })
        .select("-passwordHash")
        .populate(
            "exercises",
            "name description category trackingMode referenceVideo referenceImage targetHoldSeconds matchThreshold configuration",
        );

    if (!session || !session.isActive || isExpired(session)) {
        throw new Error("Session is unavailable or has expired.");
    }

    return {
        title: session.title,
        description: session.description,
        inviteCode: session.inviteCode,
        exercises: session.exercises,
        expiresAt: session.expiresAt,
    };
};

export const joinGeneralizedSession = async ({
    inviteCode,
    password,
    displayName,
}) => {
    if (!inviteCode?.trim()) {
        throw new Error("Invite code is required.");
    }

    if (!password) {
        throw new Error("Session password is required.");
    }

    if (!displayName?.trim()) {
        throw new Error("Enter your name to join.");
    }

    if (displayName.trim().length > 80) {
        throw new Error("Name must be 80 characters or fewer.");
    }

    const session = await GeneralizedSession.findOne({
        inviteCode: inviteCode.trim().toUpperCase(),
    }).select("+passwordHash");

    if (!session || !session.isActive || isExpired(session)) {
        throw new Error("Session is unavailable or has expired.");
    }

    const passwordMatches = await bcrypt.compare(
        password,
        session.passwordHash,
    );

    if (!passwordMatches) {
        throw new Error("Incorrect session password.");
    }

    const participant = {
        participantId: generateParticipantId(),
        displayName: displayName.trim(),
        joinedAt: new Date(),
    };

    session.participants.push(participant);
    await session.save();

    return {
        participantId: participant.participantId,
        session: {
            id: session._id,
            title: session.title,
            description: session.description,
            exercises: session.exercises,
        },
    };
};
