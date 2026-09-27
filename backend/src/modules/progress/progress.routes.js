import express from "express";

import { getProgress, getSessions } from "./progress.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get(
    "/patient/:patientId",
    authenticate,
    authorize("PHYSIO"),
    getProgress,
);

router.get(
    "/patient/:patientId/sessions",
    authenticate,
    authorize("PHYSIO"),
    getSessions,
);

export default router;
