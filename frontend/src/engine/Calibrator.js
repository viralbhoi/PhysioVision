import PhysioGeometry from "./geometry.js";

class Calibrator {
    constructor({
        visibilityThreshold = 0.6,
        lowerPercentile = 5,
        upperPercentile = 95,
        bilateralThreshold = 0.7,
        tolerance = 15,
    } = {}) {
        this.visibilityThreshold = visibilityThreshold;

        this.lowerPercentile = lowerPercentile;

        this.upperPercentile = upperPercentile;

        this.bilateralThreshold = bilateralThreshold;

        this.defaultTolerance = tolerance;

        this.frames = [];
    }

    // =========================================================
    // Add one reference-video frame
    // =========================================================

    addFrame(worldLandmarks) {
        if (!worldLandmarks || worldLandmarks.length === 0) {
            return false;
        }

        if (!this.hasRequiredVisibility(worldLandmarks)) {
            return false;
        }

        const angles = PhysioGeometry.getStandardAngles(worldLandmarks);

        this.frames.push(angles);

        return true;
    }

    // =========================================================
    // Required landmark visibility
    // =========================================================

    hasRequiredVisibility(landmarks) {
        const required = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

        return required.every((index) => {
            const landmark = landmarks[index];

            return (
                landmark &&
                (landmark.visibility ?? 1) >= this.visibilityThreshold
            );
        });
    }

    // =========================================================
    // Percentile
    // =========================================================

    percentile(values, p) {
        if (!values.length) {
            return 0;
        }

        const sorted = [...values].sort((a, b) => a - b);

        const index = (p / 100) * (sorted.length - 1);

        const lower = Math.floor(index);

        const upper = Math.ceil(index);

        if (lower === upper) {
            return sorted[lower];
        }

        return (
            sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
        );
    }

    // =========================================================
    // Filter angle trajectory
    // =========================================================

    getFilteredRange(values) {
        if (!values.length) {
            return {
                min: 0,
                max: 0,
                range: 0,
            };
        }

        const min = this.percentile(values, this.lowerPercentile);

        const max = this.percentile(values, this.upperPercentile);

        return {
            min,
            max,
            range: max - min,
        };
    }

    // =========================================================
    // Calculate ROM for every joint
    // =========================================================

    calculateJointROM() {
        if (!this.frames.length) {
            return {};
        }

        const jointNames = Object.keys(this.frames[0]);

        const result = {};

        for (const joint of jointNames) {
            const values = this.frames
                .map((frame) => frame[joint])
                .filter((value) => Number.isFinite(value));

            if (!values.length) {
                continue;
            }

            result[joint] = this.getFilteredRange(values);
        }

        return result;
    }

    // =========================================================
    // Find primary mover
    // =========================================================

    findPrimaryJoint(jointROM) {
        let primaryJoint = null;
        let largestRange = -Infinity;

        Object.entries(jointROM).forEach(([joint, data]) => {
            if (data.range > largestRange) {
                largestRange = data.range;

                primaryJoint = joint;
            }
        });

        return primaryJoint;
    }

    // =========================================================
    // Detect bilateral movement
    // =========================================================

    detectBilateralJoint(primaryJoint, jointROM) {
        if (!primaryJoint) {
            return null;
        }

        const pairs = {
            left_elbow: "right_elbow",

            right_elbow: "left_elbow",

            left_shoulder: "right_shoulder",

            right_shoulder: "left_shoulder",

            left_knee: "right_knee",

            right_knee: "left_knee",

            left_hip: "right_hip",

            right_hip: "left_hip",
        };

        const partner = pairs[primaryJoint];

        if (!partner) {
            return null;
        }

        if (!jointROM[primaryJoint] || !jointROM[partner]) {
            return null;
        }

        const primaryRange = jointROM[primaryJoint].range;

        const partnerRange = jointROM[partner].range;

        if (primaryRange <= 0) {
            return null;
        }

        if (partnerRange >= primaryRange * this.bilateralThreshold) {
            return partner;
        }

        return null;
    }

    // =========================================================
    // Generate golden trajectory
    // =========================================================

    generateGoldenTrajectory(primaryJoints) {
        return this.frames.map((frame) => {
            const point = {};

            primaryJoints.forEach((joint) => {
                if (Number.isFinite(frame[joint])) {
                    point[joint] = frame[joint];
                }
            });

            return point;
        });
    }

    // =========================================================
    // Main calibration
    // =========================================================

    calibrate() {
        if (this.frames.length < 10) {
            throw new Error(
                "Not enough valid reference frames for calibration.",
            );
        }

        const allJoints = this.calculateJointROM();

        const primaryJoint = this.findPrimaryJoint(allJoints);

        if (!primaryJoint) {
            throw new Error("Unable to determine primary movement joint.");
        }

        const bilateralJoint = this.detectBilateralJoint(
            primaryJoint,
            allJoints,
        );

        const primaryJoints = bilateralJoint
            ? [primaryJoint, bilateralJoint]
            : [primaryJoint];

        const goldenTrajectory = this.generateGoldenTrajectory(primaryJoints);

        return {
            primaryJoints,

            allJoints,

            tolerance: this.defaultTolerance,

            goldenTrajectory,

            frameCount: this.frames.length,
        };
    }

    // =========================================================
    // Reset
    // =========================================================

    reset() {
        this.frames = [];
    }
}

export default Calibrator;
