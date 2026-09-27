import { getPhysioPatients } from "./physio.service.js";

export const getPatients = async (req, res) => {
    try {
        const patients = await getPhysioPatients(req.user.userId);

        res.status(200).json({
            patients,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
