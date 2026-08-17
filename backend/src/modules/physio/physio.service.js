import Physiotherapist from "../../models/Physiotherapist.js";

export const getMyPatients = async (userId) => {
    const physiotherapist = await Physiotherapist.findOne({
        user: userId,
    }).populate({
        path: "patients",
        populate: {
            path: "user",
            select: "name email",
        },
    });

    if (!physiotherapist) {
        throw new Error("Physiotherapist profile not found");
    }

    return physiotherapist.patients;
};
