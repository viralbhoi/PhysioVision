class ROMJudge {
    constructor(config) {
        this.config = config || {};

        // -----------------------------------------
        // State
        // -----------------------------------------

        this.state = "RESTING";
        this.reps = 0;

        this.lastRepScore = 0;
        this.totalScoreAccumulator = 0;
        this.averageScore = 0;
        this.repScores = [];

        // -----------------------------------------
        // Configuration
        // -----------------------------------------

        this.primaryJoints =
            this.config.primaryJoints || this.config.primary_joints || [];

        this.allJoints = this.config.allJoints || this.config.all_joints || {};

        this.activeJoints = Object.keys(this.allJoints);

        this.goldenTrajectory =
            this.config.goldenTrajectory || this.config.golden_trajectory || [];

        this.tolerance = this.config.tolerance ?? 15;

        // -----------------------------------------
        // EMA smoothing
        // -----------------------------------------

        this.smoothedAngles = {};
        this.alpha = 0.35;

        // -----------------------------------------
        // ROM tracking
        // -----------------------------------------

        this.maxAchievedPct = 0;
        this.minAchievedPct = 1;

        // -----------------------------------------
        // Strict cycle thresholds
        // -----------------------------------------

        this.BOTTOM_THRESHOLD = 0.2;
        this.TOP_THRESHOLD = 0.45;
        this.HYSTERESIS = 0.1;

        // -----------------------------------------
        // Rep validation
        // -----------------------------------------

        this.validPeakReached = false;
        this.currentRepErrors = [];

        // -----------------------------------------
        // Live starting posture
        // -----------------------------------------

        this.liveBaselines = null;
    }

    // =========================================================
    // Utility
    // =========================================================

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    getAveragePrimary(frame) {
        if (!frame || !this.primaryJoints.length) {
            return 0;
        }

        const values = this.primaryJoints
            .map((joint) => frame[joint])
            .filter((value) => value !== undefined && value !== null);

        if (!values.length) {
            return 0;
        }

        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    // =========================================================
    // ROM percentage
    // =========================================================

    getCompletionPercentage(cleanAngles) {
        const percentages = [];

        for (const joint of this.primaryJoints) {
            const jointConfig = this.allJoints[joint];

            if (!jointConfig) {
                continue;
            }

            const minAngle = Number(jointConfig.min_angle ?? 0);
            const maxAngle = Number(jointConfig.max_angle ?? 180);

            const baseAngle = this.liveBaselines
                ? (this.liveBaselines[joint] ?? minAngle)
                : minAngle;

            const currentAngle = cleanAngles[joint] ?? baseAngle;

            let maxPossibleMovement = Math.max(
                Math.abs(maxAngle - baseAngle),
                Math.abs(minAngle - baseAngle),
            );

            // Prevent extremely small ranges
            if (maxPossibleMovement < 10) {
                maxPossibleMovement = 10;
            }

            const moved = Math.abs(currentAngle - baseAngle);

            const pct = moved / maxPossibleMovement;

            percentages.push(this.clamp(pct, 0, 1));
        }

        if (!percentages.length) {
            return 0;
        }

        // Bilateral exercise:
        // minimum side determines overall completion.
        return Math.min(...percentages);
    }

    // =========================================================
    // Golden trajectory matching
    // =========================================================

    findBestGoldenFrame(userAngles) {
        if (!this.goldenTrajectory.length) {
            return null;
        }

        const userTarget = this.getAveragePrimary(userAngles);

        let bestFrame = null;
        let smallestDifference = Infinity;

        for (const frame of this.goldenTrajectory) {
            const goldenTarget = this.getAveragePrimary(frame);

            const difference = Math.abs(goldenTarget - userTarget);

            if (difference < smallestDifference) {
                smallestDifference = difference;
                bestFrame = frame;
            }
        }

        return bestFrame;
    }

    // =========================================================
    // Frame accuracy
    // =========================================================

    calculateFrameAccuracy(userAngles) {
        const bestFrame = this.findBestGoldenFrame(userAngles);

        if (!bestFrame) {
            return 100;
        }

        let errorSum = 0;
        let jointsCompared = 0;

        for (const joint of this.activeJoints) {
            const userAngle = userAngles[joint];
            const goldenAngle = bestFrame[joint];

            if (userAngle !== undefined && goldenAngle !== undefined) {
                errorSum += Math.abs(userAngle - goldenAngle);

                jointsCompared++;
            }
        }

        if (jointsCompared === 0) {
            return 100;
        }

        const averageError = errorSum / jointsCompared;

        if (averageError <= 5) {
            return 100;
        }

        return Math.max(0, 100 - (averageError - 5) * 4);
    }

    // =========================================================
    // Live form feedback
    // =========================================================

    generateLiveFeedback(userAngles) {
        if (!this.goldenTrajectory.length || this.state === "RESTING") {
            return {
                ui: "Ready...",
                tts: "",
            };
        }

        const bestFrame = this.findBestGoldenFrame(userAngles);

        if (!bestFrame) {
            return {
                ui: "Keep moving...",
                tts: "",
            };
        }

        const uiList = [];
        const ttsList = [];

        for (const joint of this.primaryJoints) {
            const userAngle = userAngles[joint];
            const goldenAngle = bestFrame[joint];

            if (userAngle === undefined || goldenAngle === undefined) {
                continue;
            }

            const difference = goldenAngle - userAngle;

            if (Math.abs(difference) > 5) {
                const cleanName = joint
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase());

                const offset = Math.round(Math.abs(difference) * 10) / 10;

                const directionUI =
                    difference > 0 ? "Extend/Open" : "Bend/Close";

                uiList.push(`${directionUI} ${cleanName} (${offset}°)`);

                const directionTTS = difference > 0 ? "extend" : "bend";

                ttsList.push(`Please ${directionTTS} your ${cleanName}`);
            }
        }

        return {
            ui: uiList.length ? uiList.join(" | ") : "Flawless form!",

            tts: ttsList.length ? ttsList.join(" and ") : "Flawless form!",
        };
    }

    // =========================================================
    // Plane validation
    // =========================================================

    validatePlane(cleanAngles) {
        if (!this.goldenTrajectory.length || !this.primaryJoints.length) {
            return {
                valid: true,
                message: "",
            };
        }

        const bestFrame = this.findBestGoldenFrame(cleanAngles);

        if (!bestFrame) {
            return {
                valid: true,
                message: "",
            };
        }

        const primary = this.primaryJoints[0];

        let baseJoint = primary
            .replace("_elbow", "_shoulder")
            .replace("_knee", "_hip");

        const planeKey = `${baseJoint}_plane`;

        const userPlane = cleanAngles[planeKey];

        const goldenPlane = bestFrame[planeKey];

        if (userPlane === undefined || goldenPlane === undefined) {
            return {
                valid: true,
                message: "",
            };
        }

        const planeDifference = userPlane - goldenPlane;

        if (Math.abs(planeDifference) <= 40) {
            return {
                valid: true,
                message: "",
            };
        }

        const action = planeDifference > 0 ? "FORWARD" : "SIDEWAYS";

        const part = baseJoint.includes("shoulder") ? "ARM" : "LEG";

        return {
            valid: false,
            message:
                `BRING ${part} MORE ${action} ` +
                `(${Math.round(Math.abs(planeDifference) * 10) / 10}°)`,
        };
    }

    // =========================================================
    // EMA smoothing
    // =========================================================

    smoothAngles(rawAngles) {
        const cleanAngles = {};

        for (const [joint, angle] of Object.entries(rawAngles || {})) {
            if (angle !== null && angle !== undefined) {
                if (this.smoothedAngles[joint] === undefined) {
                    this.smoothedAngles[joint] = angle;
                } else {
                    this.smoothedAngles[joint] =
                        this.alpha * angle +
                        (1 - this.alpha) * this.smoothedAngles[joint];
                }
            }

            cleanAngles[joint] = this.smoothedAngles[joint] ?? 0;
        }

        return cleanAngles;
    }

    // =========================================================
    // Live baseline calibration
    // =========================================================

    calibrateBaseline(cleanAngles) {
        if (this.liveBaselines !== null) {
            return true;
        }

        const valid = this.primaryJoints.every(
            (joint) =>
                cleanAngles[joint] !== undefined && cleanAngles[joint] > 0,
        );

        if (!valid) {
            return false;
        }

        this.liveBaselines = {};

        for (const joint of this.primaryJoints) {
            this.liveBaselines[joint] = cleanAngles[joint];
        }

        return true;
    }

    // =========================================================
    // Complete a repetition
    // =========================================================

    completeRepetition() {
        if (!this.validPeakReached) {
            return;
        }

        const movementScore = this.clamp(
            ((this.maxAchievedPct - this.minAchievedPct) / this.TOP_THRESHOLD) *
                100,
            0,
            100,
        );

        const formAccuracy = this.currentRepErrors.length
            ? this.currentRepErrors.reduce((sum, value) => sum + value, 0) /
              this.currentRepErrors.length
            : 100;

        const calculatedScore =
            Math.round((movementScore * 0.7 + formAccuracy * 0.3) * 10) / 10;

        // Rep accepted only if score >= 50
        if (calculatedScore >= 50) {
            this.reps++;

            this.lastRepScore = calculatedScore;

            this.totalScoreAccumulator += calculatedScore;

            this.averageScore = this.totalScoreAccumulator / this.reps;

            this.repScores.push(calculatedScore);
        }
    }

    // =========================================================
    // Reset cycle
    // =========================================================

    resetCycle() {
        this.state = "RESTING";
        this.validPeakReached = false;
        this.currentRepErrors = [];

        this.maxAchievedPct = 0;
        this.minAchievedPct = 1;
    }

    // =========================================================
    // MASTER FRAME PROCESSOR
    // =========================================================

    processFrame(rawAngles) {
        // -----------------------------------------
        // 1. Smooth raw angles
        // -----------------------------------------

        const cleanAngles = this.smoothAngles(rawAngles);

        // -----------------------------------------
        // 2. Live calibration
        // -----------------------------------------

        if (!this.calibrateBaseline(cleanAngles)) {
            return {
                reps: this.reps,
                state: "CALIBRATING",
                progress: 0,
                lastScore: 0,
                avgScore: 0,
                repScores: [...this.repScores],
                feedback: "Get in starting position...",
                ttsFeedback: "",
            };
        }

        // -----------------------------------------
        // 3. Calculate movement percentage
        // -----------------------------------------

        const pct = this.getCompletionPercentage(cleanAngles);

        // -----------------------------------------
        // 4. Calculate form accuracy
        // -----------------------------------------

        const frameAccuracy = this.calculateFrameAccuracy(cleanAngles);

        // -----------------------------------------
        // 5. Plane gatekeeper
        // -----------------------------------------

        const plane = this.validatePlane(cleanAngles);

        const planeIsValid = plane.valid;

        // -----------------------------------------
        // 6. Strict repetition FSM
        // -----------------------------------------

        if (this.state === "RESTING") {
            if (pct > this.BOTTOM_THRESHOLD && planeIsValid) {
                this.state = "LIFTING";

                this.maxAchievedPct = pct;
                this.minAchievedPct = 1;

                this.currentRepErrors = [frameAccuracy];

                this.validPeakReached = false;
            }
        } else if (this.state === "LIFTING") {
            this.maxAchievedPct = Math.max(this.maxAchievedPct, pct);

            this.currentRepErrors.push(frameAccuracy);

            // Reached valid peak
            if (pct >= this.TOP_THRESHOLD) {
                if (planeIsValid) {
                    this.state = "PEAK";
                    this.validPeakReached = true;
                }
            }

            // Started moving downward
            else if (pct < this.maxAchievedPct - this.HYSTERESIS) {
                this.state = "LOWERING";
                this.minAchievedPct = pct;
            }
        } else if (this.state === "PEAK") {
            this.maxAchievedPct = Math.max(this.maxAchievedPct, pct);

            this.currentRepErrors.push(frameAccuracy);

            if (pct < this.maxAchievedPct - this.HYSTERESIS) {
                this.state = "LOWERING";
                this.minAchievedPct = pct;
            }
        } else if (this.state === "LOWERING") {
            this.minAchievedPct = Math.min(this.minAchievedPct, pct);

            this.currentRepErrors.push(frameAccuracy);

            const isResting = pct <= this.BOTTOM_THRESHOLD;

            const isBouncing = pct > this.minAchievedPct + this.HYSTERESIS;

            // Returned to starting position
            if (isResting) {
                if (this.validPeakReached) {
                    this.completeRepetition();
                }

                this.resetCycle();
            }

            // User bounced back upward
            else if (isBouncing) {
                this.state = "LIFTING";
                this.maxAchievedPct = pct;
            }
        }

        // -----------------------------------------
        // 7. Generate feedback
        // -----------------------------------------

        const feedback = this.generateLiveFeedback(cleanAngles);

        let currentUIFeedback = feedback.ui;

        let currentTTSFeedback = feedback.tts;

        // Plane error overrides form feedback
        if (!planeIsValid && pct > this.BOTTOM_THRESHOLD) {
            currentUIFeedback = plane.message;

            const action = plane.message.includes("FORWARD")
                ? "forward"
                : "to the side";

            const part = plane.message.includes("ARM") ? "arm" : "leg";

            currentTTSFeedback = `Bring your ${part} ${action}`;
        }

        // -----------------------------------------
        // 8. UI progress
        // -----------------------------------------

        const uiProgress = Math.min(100, (pct / this.TOP_THRESHOLD) * 100);

        // -----------------------------------------
        // 9. Return frame result
        // -----------------------------------------

        return {
            reps: this.reps,

            state: this.state,

            progress: Math.round(uiProgress * 10) / 10,

            lastScore: this.lastRepScore,

            avgScore: Math.round(this.averageScore * 10) / 10,

            repScores: [...this.repScores],

            feedback: currentUIFeedback,

            ttsFeedback: currentTTSFeedback,

            // Useful internally/UI
            frameAccuracy: Math.round(frameAccuracy * 10) / 10,

            planeValid: planeIsValid,
        };
    }

    // =========================================================
    // Session result
    // =========================================================

    getSessionResult() {
        return {
            completedReps: this.reps,

            averageScore: Math.round(this.averageScore * 10) / 10,

            repScores: [...this.repScores],
        };
    }

    // =========================================================
    // Reset entire judge
    // =========================================================

    reset() {
        this.state = "RESTING";

        this.reps = 0;

        this.lastRepScore = 0;
        this.totalScoreAccumulator = 0;
        this.averageScore = 0;

        this.repScores = [];

        this.smoothedAngles = {};

        this.maxAchievedPct = 0;
        this.minAchievedPct = 1;

        this.validPeakReached = false;
        this.currentRepErrors = [];

        this.liveBaselines = null;
    }
}

export default ROMJudge;
