import express from "express";

import {
    assign,
    getMyAssignments,
    getAssignments,
} from "./assignment.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", authenticate, authorize("PHYSIO"), assign);

router.get("/my", authenticate, authorize("PATIENT"), getMyAssignments);

router.get("/physio", authenticate, authorize("PHYSIO"), getAssignments);

export default router;
