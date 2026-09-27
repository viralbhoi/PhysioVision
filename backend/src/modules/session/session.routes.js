import express from "express";

import { start, complete, getMine } from "./session.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.post("/start", authenticate, authorize("PATIENT"), start);

router.patch("/:id/complete", authenticate, authorize("PATIENT"), complete);

router.get("/my", authenticate, authorize("PATIENT"), getMine);

export default router;
