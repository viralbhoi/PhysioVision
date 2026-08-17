import express from "express";

import { getPatients } from "./physio.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get("/patients", authenticate, authorize("PHYSIO"), getPatients);

export default router;
