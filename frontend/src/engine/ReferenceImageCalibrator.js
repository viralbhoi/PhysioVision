import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const JOINTS = [
    { name: "left_elbow", a: 11, b: 13, c: 15 },
    { name: "right_elbow", a: 12, b: 14, c: 16 },
    { name: "left_shoulder", a: 23, b: 11, c: 13 },
    { name: "right_shoulder", a: 24, b: 12, c: 14 },
    { name: "left_knee", a: 23, b: 25, c: 27 },
    { name: "right_knee", a: 24, b: 26, c: 28 },
    { name: "left_hip", a: 11, b: 23, c: 25 },
    { name: "right_hip", a: 12, b: 24, c: 26 },
];

const isVisible = (point, threshold = 0.55) =>
    Boolean(
        point && (point.visibility == null || point.visibility >= threshold),
    );

function calculateAngle(a, b, c) {
    const first = [a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)];

    const second = [c.x - b.x, c.y - b.y, (c.z || 0) - (b.z || 0)];

    const firstLength = Math.hypot(...first);
    const secondLength = Math.hypot(...second);

    if (firstLength < 1e-7 || secondLength < 1e-7) {
        return null;
    }

    const dotProduct = first.reduce(
        (sum, value, index) => sum + value * second[index],
        0,
    );

    const cosine = Math.max(
        -1,
        Math.min(1, dotProduct / (firstLength * secondLength)),
    );

    return Math.acos(cosine) * (180 / Math.PI);
}

function extractAngles(landmarks) {
    const angles = [];

    for (const joint of JOINTS) {
        const a = landmarks[joint.a];
        const b = landmarks[joint.b];
        const c = landmarks[joint.c];

        if (![a, b, c].every((point) => isVisible(point))) {
            continue;
        }

        const value = calculateAngle(a, b, c);

        if (Number.isFinite(value)) {
            angles.push({
                name: joint.name,
                value,
            });
        }
    }

    return angles;
}

function extractRelativeLandmarks(landmarks) {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    if (
        ![leftHip, rightHip, leftShoulder, rightShoulder].every((point) =>
            isVisible(point),
        )
    ) {
        return [];
    }

    const origin = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
        z: ((leftHip.z || 0) + (rightHip.z || 0)) / 2,
    };

    const scale = Math.max(
        0.0001,
        Math.hypot(
            leftShoulder.x - rightShoulder.x,
            leftShoulder.y - rightShoulder.y,
        ),
    );

    return landmarks.map((point, index) => ({
        index,
        x: isVisible(point) ? (point.x - origin.x) / scale : null,
        y: isVisible(point) ? (point.y - origin.y) / scale : null,
        z: isVisible(point) ? ((point.z || 0) - origin.z) / scale : null,
    }));
}

export default class ReferenceImageCalibrator {
    constructor() {
        this.landmarker = null;
    }

    async initialize() {
        if (this.landmarker) return;

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        try {
            this.landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: MODEL_URL,
                    delegate: "GPU",
                },
                runningMode: "IMAGE",
                numPoses: 1,
                minPoseDetectionConfidence: 0.6,
                minPosePresenceConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });
        } catch {
            // Retry on CPU if GPU delegate is unavailable.
            this.landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: MODEL_URL,
                    delegate: "CPU",
                },
                runningMode: "IMAGE",
                numPoses: 1,
                minPoseDetectionConfidence: 0.6,
                minPosePresenceConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });
        }
    }

    async calibrate(file) {
        if (!file || !file.type.startsWith("image/")) {
            throw new Error("Please select a valid reference image.");
        }

        await this.initialize();

        const bitmap = await createImageBitmap(file);

        try {
            const result = this.landmarker.detect(bitmap);
            const worldLandmarks = result?.worldLandmarks?.[0];
            const imageLandmarks = result?.landmarks?.[0];

            if (!worldLandmarks || !imageLandmarks) {
                throw new Error(
                    "No pose detected. Use a clear image showing the person's full body.",
                );
            }

            const angles = extractAngles(worldLandmarks);

            if (angles.length < 4) {
                throw new Error(
                    "Too few reliable joints detected. Choose a clearer reference image.",
                );
            }

            return {
                version: 1,
                angles,
                relativeLandmarks: extractRelativeLandmarks(imageLandmarks),
                usableLandmarks: imageLandmarks.filter((point) =>
                    isVisible(point),
                ).length,
                totalLandmarks: imageLandmarks.length,
                calibratedAt: new Date().toISOString(),
            };
        } finally {
            bitmap.close?.();
        }
    }

    close() {
        this.landmarker?.close();
        this.landmarker = null;
    }
}
