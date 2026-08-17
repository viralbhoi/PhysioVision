import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../../models/User.js";
import Patient from "../../models/Patient.js";
import Physiotherapist from "../../models/Physiotherapist.js";

export const registerUser = async ({ name, email, password, role }) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        name,
        email,
        password: passwordHash,
        role,
    });

    if (role === "PATIENT") {
        await Patient.create({
            user: user._id,
        });
    }

    if (role === "PHYSIO") {
        await Physiotherapist.create({
            user: user._id,
        });
    }

    return user;
};

export const loginUser = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        },
    );

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};
