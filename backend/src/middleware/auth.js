import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        next();
    };
};
