import express from "express";

import { generateCode, connect, getMine } from "./connection.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

// Physio generates connection code
router.post("/code", authenticate, authorize("PHYSIO"), generateCode);

// Patient enters connection code
router.post("/connect", authenticate, authorize("PATIENT"), connect);

// Patient gets connected physio
router.get("/mine", authenticate, authorize("PATIENT"), getMine);

export default router;
