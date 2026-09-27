import express from "express";

import { create, getAll, getOne } from "./exercise.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getAll);

router.get("/:id", authenticate, getOne);

router.post("/", authenticate, authorize("PHYSIO"), create);

export default router;
