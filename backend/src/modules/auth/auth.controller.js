import { registerUser, loginUser } from "./auth.service.js";

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const user = await registerUser({
            name,
            email,
            password,
            role,
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await loginUser(email, password);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(401).json({
            message: error.message,
        });
    }
};

export const getMe = async (req, res) => {
    return res.status(200).json({
        user: req.user,
    });
};
