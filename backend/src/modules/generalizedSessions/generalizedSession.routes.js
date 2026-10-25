import express from "express";

import {
    createSession,
    getMySessions,
    updateSessionStatus,
    getSessionDetails,
    joinSession,
} from "./generalizedSession.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

// Physiotherapist routes
router.post("/", authenticate, authorize("PHYSIO"), createSession);

router.get("/mine", authenticate, authorize("PHYSIO"), getMySessions);

router.patch(
    "/:id/status",
    authenticate,
    authorize("PHYSIO"),
    updateSessionStatus,
);

// Public routes: no existing patient-physio assignment required
router.get("/join/:inviteCode", getSessionDetails);

router.post("/join/:inviteCode", joinSession);

export default router;
