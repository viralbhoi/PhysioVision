import { getMyPatients } from "./physio.service.js";

export const getPatients = async (req, res) => {
    try {
        const patients = await getMyPatients(req.user.userId);

        return res.status(200).json({
            patients,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
