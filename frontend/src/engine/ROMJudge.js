import DTWMatcher from "./DTWMatcher.js";

class ROMJudge {
    constructor(config = {}) {
        this.config = config || {};
        this.dtwMatcher = new DTWMatcher();

        this.primaryJoints =
            this.config.primaryJoints || this.config.primary_joints || [];

        this.allJoints = this.config.allJoints || this.config.all_joints || {};

        this.activeJoints = Object.keys(this.allJoints);

        this.goldenTrajectory =
            this.config.goldenTrajectory || this.config.golden_trajectory || [];

        this.tolerance = Number(this.config.tolerance ?? 15);

        this.BOTTOM_THRESHOLD = 0.2;
        this.TOP_THRESHOLD = 0.45;
        this.HYSTERESIS = 0.1;

        // Ignore attempts below 30% of the reference movement.
        this.MIN_MOVEMENT_FOR_REP = 0.3;

        // Start tracking smaller partial movements too.
        this.START_MOVEMENT_THRESHOLD = 0.08;

        this.MIN_TRAJECTORY_FRAMES = 3;
        this.MIN_VISIBLE_LANDMARKS = 8;
        this.MIN_POSE_CONFIDENCE = 0.6;

        this.alpha = 0.35;

        this.reset();
    }

    clamp(value, min = 0, max = 100) {
        return Math.max(min, Math.min(max, value));
    }

    round(value, places = 1) {
        const factor = 10 ** places;
        return Math.round(value * factor) / factor;
    }

    hasValidReference() {
        return (
            Array.isArray(this.goldenTrajectory) &&
            this.goldenTrajectory.length >= 2
        );
    }

    hasUsableJointConfig() {
        return (
            this.primaryJoints.length > 0 &&
            this.primaryJoints.every((joint) => {
                const range = this.allJoints[joint];
                if (!range) return false;

                const min = Number(range.min_angle ?? range.min);
                const max = Number(range.max_angle ?? range.max);

                return (
                    Number.isFinite(min) && Number.isFinite(max) && max > min
                );
            })
        );
    }

    getAveragePrimary(frame) {
        if (!frame || !this.primaryJoints.length) return null;

        const values = this.primaryJoints
            .map((joint) => frame[joint])
            .filter(Number.isFinite);

        if (!values.length) return null;

        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    smoothAngles(rawAngles) {
        const cleanAngles = {};

        for (const [joint, value] of Object.entries(rawAngles || {})) {
            if (!Number.isFinite(value)) continue;

            if (this.smoothedAngles[joint] === undefined) {
                this.smoothedAngles[joint] = value;
            } else {
                this.smoothedAngles[joint] =
                    this.alpha * value +
                    (1 - this.alpha) * this.smoothedAngles[joint];
            }

            cleanAngles[joint] = this.smoothedAngles[joint];
        }

        return cleanAngles;
    }

    calibrateBaseline(cleanAngles) {
        if (this.liveBaselines !== null) return true;

        if (!this.primaryJoints.length) {
            this.calibrationError =
                "Exercise configuration has no primary joints.";
            return false;
        }

        const valid = this.primaryJoints.every(
            (joint) =>
                Number.isFinite(cleanAngles[joint]) && cleanAngles[joint] > 0,
        );

        if (!valid) {
            this.calibrationError =
                "Keep your primary joints visible to the camera.";
            return false;
        }

        this.liveBaselines = {};

        for (const joint of this.primaryJoints) {
            this.liveBaselines[joint] = cleanAngles[joint];
        }

        this.calibrationError = "";
        return true;
    }

    getCompletionPercentage(cleanAngles) {
        if (!this.liveBaselines || !this.primaryJoints.length) return 0;

        const percentages = [];

        for (const joint of this.primaryJoints) {
            const range = this.allJoints[joint];
            const baseline = this.liveBaselines[joint];
            const current = cleanAngles[joint];

            if (
                !range ||
                !Number.isFinite(baseline) ||
                !Number.isFinite(current)
            ) {
                continue;
            }

            const min = Number(range.min_angle ?? range.min);
            const max = Number(range.max_angle ?? range.max);

            if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
                continue;
            }

            const movementRange = Math.max(
                Math.abs(max - baseline),
                Math.abs(baseline - min),
            );

            if (movementRange < 10) continue;

            const movement = Math.abs(current - baseline);

            percentages.push(this.clamp(movement / movementRange, 0, 1));
        }

        if (!percentages.length) return 0;

        // Every configured primary joint must participate.
        return Math.min(...percentages);
    }

    findBestGoldenFrame(userAngles) {
        if (!this.hasValidReference()) return null;

        const target = this.getAveragePrimary(userAngles);
        if (!Number.isFinite(target)) return null;

        let bestFrame = null;
        let smallestDifference = Infinity;

        for (const frame of this.goldenTrajectory) {
            const referenceValue = this.getAveragePrimary(frame);
            if (!Number.isFinite(referenceValue)) continue;

            const difference = Math.abs(referenceValue - target);

            if (difference < smallestDifference) {
                smallestDifference = difference;
                bestFrame = frame;
            }
        }

        return bestFrame;
    }

    calculateFrameAccuracy(userAngles) {
        const bestFrame = this.findBestGoldenFrame(userAngles);
        if (!bestFrame) return null;

        const joints = this.primaryJoints.length
            ? this.primaryJoints
            : this.activeJoints;

        let errorSum = 0;
        let count = 0;

        for (const joint of joints) {
            const userValue = userAngles[joint];
            const referenceValue = bestFrame[joint];

            if (Number.isFinite(userValue) && Number.isFinite(referenceValue)) {
                errorSum += Math.abs(userValue - referenceValue);
                count++;
            }
        }

        if (!count) return null;

        const averageError = errorSum / count;
        const acceptableError = Math.max(5, this.tolerance * 0.35);

        return this.clamp(
            100 * Math.exp(-Math.max(0, averageError - 2) / acceptableError),
        );
    }

    normalizeTrajectory(trajectory) {
        if (!Array.isArray(trajectory)) return [];

        return trajectory.map((point) => {
            const normalized = {};

            for (const [joint, value] of Object.entries(point || {})) {
                if (!Number.isFinite(value)) continue;

                const range = this.allJoints[joint];

                if (!range) {
                    normalized[joint] = value / 180;
                    continue;
                }

                const min = Number(range.min_angle ?? range.min);
                const max = Number(range.max_angle ?? range.max);

                if (
                    !Number.isFinite(min) ||
                    !Number.isFinite(max) ||
                    max <= min
                ) {
                    continue;
                }

                normalized[joint] = (value - min) / (max - min);
            }

            return normalized;
        });
    }

    calculateTrajectoryScore() {
        if (
            !this.hasValidReference() ||
            !Array.isArray(this.currentTrajectory) ||
            this.currentTrajectory.length < this.MIN_TRAJECTORY_FRAMES
        ) {
            return null;
        }

        const reference = this.normalizeTrajectory(this.goldenTrajectory);

        const user = this.normalizeTrajectory(this.currentTrajectory);

        if (!reference.length || !user.length) return null;

        const score = this.dtwMatcher.similarity(reference, user);

        return Number.isFinite(score) ? this.clamp(score) : null;
    }

    generateLiveFeedback(userAngles) {
        if (this.state === "RESTING") {
            return { ui: "Ready to begin", tts: "" };
        }

        if (!this.hasValidReference()) {
            return {
                ui: "Reference calibration is missing; form cannot be scored.",
                tts: "",
            };
        }

        const bestFrame = this.findBestGoldenFrame(userAngles);

        if (!bestFrame) {
            return {
                ui: "Keep your joints visible and continue moving.",
                tts: "",
            };
        }

        const feedback = [];

        for (const joint of this.primaryJoints) {
            const userValue = userAngles[joint];
            const referenceValue = bestFrame[joint];

            if (
                !Number.isFinite(userValue) ||
                !Number.isFinite(referenceValue)
            ) {
                continue;
            }

            const difference = referenceValue - userValue;

            if (Math.abs(difference) > Math.max(8, this.tolerance * 0.5)) {
                const name = joint
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (character) => character.toUpperCase());

                feedback.push(
                    `${difference > 0 ? "Extend/open" : "Bend/close"} ${name}`,
                );
            }
        }

        if (!feedback.length) {
            return {
                ui: "Keep the movement controlled.",
                tts: "",
            };
        }

        return {
            ui: feedback.join(" | "),
            tts: feedback[0],
        };
    }

    validatePlane(cleanAngles) {
        if (!this.hasValidReference() || !this.primaryJoints.length) {
            return {
                valid: true,
                measurable: false,
                message: "",
            };
        }

        const bestFrame = this.findBestGoldenFrame(cleanAngles);

        if (!bestFrame) {
            return {
                valid: true,
                measurable: false,
                message: "",
            };
        }

        const primary = this.primaryJoints[0];

        const baseJoint = primary
            .replace("_elbow", "_shoulder")
            .replace("_knee", "_hip");

        const planeKey = `${baseJoint}_plane`;
        const userPlane = cleanAngles[planeKey];
        const referencePlane = bestFrame[planeKey];

        if (!Number.isFinite(userPlane) || !Number.isFinite(referencePlane)) {
            return {
                valid: true,
                measurable: false,
                message: "",
            };
        }

        const difference = userPlane - referencePlane;

        if (Math.abs(difference) <= 40) {
            return {
                valid: true,
                measurable: true,
                message: "",
            };
        }

        const direction = difference > 0 ? "FORWARD" : "SIDEWAYS";
        const part = baseJoint.includes("shoulder") ? "ARM" : "LEG";

        return {
            valid: false,
            measurable: true,
            message: `BRING ${part} MORE ${direction} (${Math.round(
                Math.abs(difference),
            )}°)`,
        };
    }

    recordTrajectoryFrame(cleanAngles) {
        const point = {};

        const joints = this.primaryJoints.length
            ? this.primaryJoints
            : this.activeJoints;

        for (const joint of joints) {
            if (Number.isFinite(cleanAngles[joint])) {
                point[joint] = cleanAngles[joint];
            }
        }

        for (const key of Object.keys(cleanAngles)) {
            if (key.endsWith("_plane") && Number.isFinite(cleanAngles[key])) {
                point[key] = cleanAngles[key];
            }
        }

        if (Object.keys(point).length) {
            this.currentTrajectory.push(point);
        }
    }

    completeRepetition() {
        const movementCompletion = this.clamp(
            (this.maxAchievedPct / this.TOP_THRESHOLD) * 100,
            0,
            100,
        );

        // Ignore attempts below 30%; don't count or score them.
        if (movementCompletion < this.MIN_MOVEMENT_FOR_REP * 100) {
            this.rejectedAttempts.push({
                reason: "INSUFFICIENT_MOVEMENT",
                movementCompletion: this.round(movementCompletion),
            });

            this.lastFeedback =
                "Insufficient movement. Complete at least 30% of the movement.";

            this.currentTrajectory = [];
            return null;
        }

        const frameScores = this.currentRepErrors.filter(Number.isFinite);

        const frameAccuracy = frameScores.length
            ? frameScores.reduce((sum, score) => sum + score, 0) /
              frameScores.length
            : null;

        const trajectoryScore = this.calculateTrajectoryScore();

        // Preserve the existing trajectory-first similarity calculation.
        let similarityScore = null;

        if (Number.isFinite(trajectoryScore)) {
            similarityScore = Number.isFinite(frameAccuracy)
                ? 0.95 * trajectoryScore + 0.05 * frameAccuracy
                : trajectoryScore;
        } else if (Number.isFinite(frameAccuracy)) {
            similarityScore = frameAccuracy;
        }

        // Do not invent a score when similarity cannot be measured.
        const finalScore = Number.isFinite(similarityScore)
            ? this.round(movementCompletion * 0.6 + similarityScore * 0.4)
            : null;

        this.reps++;

        this.repScores.push(finalScore);

        if (finalScore !== null) {
            this.lastRepScore = finalScore;
            this.scoredReps++;
            this.totalScoreAccumulator += finalScore;
            this.averageScore = this.totalScoreAccumulator / this.scoredReps;

            this.lastFeedback = "Repetition completed.";
        } else {
            this.lastRepScore = null;
            this.lastFeedback =
                "Repetition counted, but similarity score is unavailable.";
        }

        this.completedAttempts.push({
            number: this.reps,
            score: finalScore,
            movementCompletion: this.round(movementCompletion),
            similarityScore:
                similarityScore === null ? null : this.round(similarityScore),
        });

        this.currentTrajectory = [];

        return {
            number: this.reps,
            score: finalScore,
            movementCompletion: this.round(movementCompletion),
            similarityScore:
                similarityScore === null ? null : this.round(similarityScore),
        };
    }

    resetCycle() {
        this.state = "RESTING";
        this.validPeakReached = false;
        this.currentRepErrors = [];
        this.maxAchievedPct = 0;
        this.minAchievedPct = 1;
        this.currentTrajectory = [];
    }

    handleInvalidPose() {
        if (this.state !== "RESTING") {
            this.rejectedAttempts.push({
                reason: "INVALID_POSE",
                movementCompletion: this.round(this.maxAchievedPct * 100),
            });
        }

        this.resetCycle();

        this.lastFeedback =
            "Pose confidence below 60%. Reposition yourself and try again.";
    }

    processFrame(rawAngles) {
        const cleanAngles = this.smoothAngles(rawAngles);

        if (!this.calibrateBaseline(cleanAngles)) {
            return this.buildResult({
                state: "CALIBRATING",
                progress: 0,
                frameAccuracy: null,
                planeValid: true,
                feedback:
                    this.calibrationError || "Get into the starting position.",
            });
        }

        if (!this.hasUsableJointConfig()) {
            return this.buildResult({
                state: "CONFIGURATION_ERROR",
                progress: 0,
                frameAccuracy: null,
                planeValid: true,
                feedback:
                    "Exercise configuration is missing valid joint angle ranges. Reconfigure this exercise before tracking.",
            });
        }

        const pct = this.getCompletionPercentage(cleanAngles);
        const frameAccuracy = this.calculateFrameAccuracy(cleanAngles);
        const plane = this.validatePlane(cleanAngles);

        if (this.state === "RESTING") {
            if (pct > this.BOTTOM_THRESHOLD && plane.valid) {
                this.state = "LIFTING";
                this.maxAchievedPct = pct;
                this.minAchievedPct = pct;
                this.currentRepErrors = [];
                this.validPeakReached = false;
                this.currentTrajectory = [];

                this.recordTrajectoryFrame(cleanAngles);

                if (Number.isFinite(frameAccuracy)) {
                    this.currentRepErrors.push(frameAccuracy);
                }
            }
        } else if (this.state === "LIFTING") {
            this.maxAchievedPct = Math.max(this.maxAchievedPct, pct);

            this.recordTrajectoryFrame(cleanAngles);

            if (Number.isFinite(frameAccuracy)) {
                this.currentRepErrors.push(frameAccuracy);
            }

            if (pct >= this.TOP_THRESHOLD && plane.valid) {
                this.state = "PEAK";
                this.validPeakReached = true;
            } else if (pct < this.maxAchievedPct - this.HYSTERESIS) {
                this.state = "LOWERING";
                this.minAchievedPct = pct;
            }
        } else if (this.state === "PEAK") {
            this.maxAchievedPct = Math.max(this.maxAchievedPct, pct);

            this.recordTrajectoryFrame(cleanAngles);

            if (Number.isFinite(frameAccuracy)) {
                this.currentRepErrors.push(frameAccuracy);
            }

            if (pct < this.maxAchievedPct - this.HYSTERESIS) {
                this.state = "LOWERING";
                this.minAchievedPct = pct;
            }
        } else if (this.state === "LOWERING") {
            this.minAchievedPct = Math.min(this.minAchievedPct, pct);

            this.recordTrajectoryFrame(cleanAngles);

            if (Number.isFinite(frameAccuracy)) {
                this.currentRepErrors.push(frameAccuracy);
            }

            const returnedToStart = pct <= this.BOTTOM_THRESHOLD;
            const bouncedUp = pct > this.minAchievedPct + this.HYSTERESIS;

            if (returnedToStart) {
                if (returnedToStart) {
                    this.completeRepetition();
                    this.resetCycle();
                } else {
                    this.rejectedAttempts.push({
                        reason: "PEAK_NOT_REACHED",
                        movementCompletion: this.round(
                            this.maxAchievedPct * 100,
                        ),
                    });

                    this.lastFeedback =
                        "Incomplete movement. Reach the required peak before returning.";
                }

                this.resetCycle();
            } else if (bouncedUp) {
                this.state = "LIFTING";
                this.maxAchievedPct = Math.max(this.maxAchievedPct, pct);
            }
        }

        const feedback = this.generateLiveFeedback(cleanAngles);

        let message = this.lastFeedback || feedback.ui;

        if (!plane.valid && pct > this.BOTTOM_THRESHOLD) {
            message = plane.message;
        } else if (
            this.state !== "RESTING" &&
            this.maxAchievedPct < this.MIN_MOVEMENT_FOR_REP
        ) {
            message =
                "Insufficient movement for rep count. Complete the full movement.";
        } else if (this.state === "LOWERING" && !this.validPeakReached) {
            message = "Incomplete movement. Reach the required peak.";
        } else if (this.lastFeedback === "Repetition completed.") {
            message = this.lastFeedback;
        }

        const uiProgress = Math.min(100, (pct / this.TOP_THRESHOLD) * 100);

        return this.buildResult({
            state: this.state,
            progress: this.round(uiProgress),
            lastScore: this.lastRepScore,
            avgScore: this.scoredReps ? this.round(this.averageScore) : null,
            frameAccuracy:
                frameAccuracy === null ? null : this.round(frameAccuracy),
            planeValid: plane.valid,
            feedback: message,
            ttsFeedback: feedback.tts,
            movementCompletion: this.round(pct * 100),
        });
    }

    buildResult(overrides = {}) {
        const result = {
            reps: this.reps,
            completedReps: this.reps,
            state: this.state,
            phase: this.state,
            progress: 0,
            lastScore: this.lastRepScore,
            score: this.lastRepScore,
            avgScore: this.scoredReps ? this.round(this.averageScore) : null,
            averageScore: this.scoredReps
                ? this.round(this.averageScore)
                : null,
            repScores: [...this.repScores],
            rejectedAttempts: [...this.rejectedAttempts],
            feedback: this.lastFeedback || "Ready to begin",
            ttsFeedback: "",
            frameAccuracy: null,
            planeValid: true,
            scoreAvailable: this.scoredReps > 0,
            ...overrides,
        };

        result.averageScore = result.avgScore;
        result.score = result.lastScore;

        return result;
    }

    getSessionResult() {
        return {
            completedReps: this.reps,
            averageScore: this.scoredReps
                ? this.round(this.averageScore)
                : null,
            repScores: [...this.repScores],
            rejectedAttempts: [...this.rejectedAttempts],
            completedAttempts: [...this.completedAttempts],
            scoredReps: this.scoredReps,
            scoreAvailable: this.scoredReps > 0,
        };
    }

    reset() {
        this.state = "RESTING";
        this.reps = 0;
        this.lastRepScore = null;
        this.totalScoreAccumulator = 0;
        this.averageScore = 0;
        this.scoredReps = 0;
        this.repScores = [];
        this.rejectedAttempts = [];
        this.completedAttempts = [];
        this.smoothedAngles = {};
        this.maxAchievedPct = 0;
        this.minAchievedPct = 1;
        this.validPeakReached = false;
        this.currentRepErrors = [];
        this.currentTrajectory = [];
        this.liveBaselines = null;
        this.calibrationError = "";
        this.lastFeedback = "";
    }
}

export default ROMJudge;
