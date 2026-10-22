import express from "express";

import { create, getAll, getOne } from "./exercise.controller.js";

import { authenticate, authorize } from "../../middleware/auth.js";

import uploadExerciseAssets from "../../middleware/uploadExerciseAssets.js";

const router = express.Router();

router.get("/", authenticate, getAll);

router.get("/:id", authenticate, getOne);

router.post(
    "/",
    authenticate,
    authorize("PHYSIO"),
    uploadExerciseAssets.fields([
        { name: "referenceImage", maxCount: 1 },
        { name: "referenceVideo", maxCount: 1 },
    ]),
    create,
);

export default router;
