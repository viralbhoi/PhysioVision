export const MIN_LANDMARK_CONFIDENCE = 0.5;

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

const isFiniteNumber = (value) =>
    typeof value === "number" && Number.isFinite(value);

export function getConfidence(point) {
    if (!point) return 0;

    const values = [point.visibility, point.presence].filter(isFiniteNumber);

    if (values.length === 0) return 0;

    return Math.max(0, Math.min(1, ...values, ...values));
}

export function isVisible(point, threshold = MIN_LANDMARK_CONFIDENCE) {
    return Boolean(
        point &&
        isFiniteNumber(point.x) &&
        isFiniteNumber(point.y) &&
        (point.z == null || isFiniteNumber(point.z)) &&
        getConfidence(point) >= threshold,
    );
}

function calculateAngle(a, b, c) {
    const ab = [a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0)];

    const cb = [c.x - b.x, c.y - b.y, (c.z ?? 0) - (b.z ?? 0)];

    const magnitudeAB = Math.hypot(...ab);
    const magnitudeCB = Math.hypot(...cb);

    if (magnitudeAB < 1e-7 || magnitudeCB < 1e-7) {
        return null;
    }

    const dot = ab.reduce((sum, value, index) => sum + value * cb[index], 0);
    const cosine = Math.max(-1, Math.min(1, dot / (magnitudeAB * magnitudeCB)));

    const angle = (Math.acos(cosine) * 180) / Math.PI;

    return Number.isFinite(angle) ? angle : null;
}

export function extractStaticPoseFeatures(worldLandmarks, normalizedLandmarks) {
    if (!Array.isArray(worldLandmarks) || !Array.isArray(normalizedLandmarks)) {
        return {
            angles: [],
            relativeLandmarks: [],
            visibleLandmarks: 0,
            landmarkConfidence: 0,
        };
    }

    const angles = [];

    for (const joint of JOINTS) {
        const worldPoints = [
            worldLandmarks[joint.a],
            worldLandmarks[joint.b],
            worldLandmarks[joint.c],
        ];

        const imagePoints = [
            normalizedLandmarks[joint.a],
            normalizedLandmarks[joint.b],
            normalizedLandmarks[joint.c],
        ];

        // World landmarks sometimes omit visibility, so validate coordinates
        // there and use normalized landmarks for confidence.
        const worldCoordinatesValid = worldPoints.every(
            (point) =>
                point &&
                isFiniteNumber(point.x) &&
                isFiniteNumber(point.y) &&
                (point.z == null || isFiniteNumber(point.z)),
        );

        if (
            !worldCoordinatesValid ||
            !imagePoints.every((point) => isVisible(point))
        ) {
            continue;
        }

        const value = calculateAngle(...worldPoints);

        if (Number.isFinite(value)) {
            angles.push({
                name: joint.name,
                value,
                confidence:
                    imagePoints.reduce(
                        (sum, point) => sum + getConfidence(point),
                        0,
                    ) / imagePoints.length,
            });
        }
    }

    const visiblePoints = normalizedLandmarks.filter((point) =>
        isVisible(point),
    );

    const visibleLandmarks = visiblePoints.length;

    const landmarkConfidence =
        visibleLandmarks > 0
            ? visiblePoints.reduce(
                  (sum, point) => sum + getConfidence(point),
                  0,
              ) / visibleLandmarks
            : 0;

    const hipLeft = normalizedLandmarks[23];
    const hipRight = normalizedLandmarks[24];
    const shoulderLeft = normalizedLandmarks[11];
    const shoulderRight = normalizedLandmarks[12];

    let relativeLandmarks = [];

    const canNormalize = [hipLeft, hipRight, shoulderLeft, shoulderRight].every(
        (point) => isVisible(point),
    );

    if (canNormalize) {
        const origin = {
            x: (hipLeft.x + hipRight.x) / 2,
            y: (hipLeft.y + hipRight.y) / 2,
            z: ((hipLeft.z ?? 0) + (hipRight.z ?? 0)) / 2,
        };

        const shoulderWidth = Math.hypot(
            shoulderLeft.x - shoulderRight.x,
            shoulderLeft.y - shoulderRight.y,
            (shoulderLeft.z ?? 0) - (shoulderRight.z ?? 0),
        );

        if (Number.isFinite(shoulderWidth) && shoulderWidth > 1e-4) {
            relativeLandmarks = normalizedLandmarks.map((point, index) => {
                if (!isVisible(point)) {
                    return {
                        index,
                        x: null,
                        y: null,
                        z: null,
                        confidence: 0,
                    };
                }

                return {
                    index,
                    x: (point.x - origin.x) / shoulderWidth,
                    y: (point.y - origin.y) / shoulderWidth,
                    z: ((point.z ?? 0) - origin.z) / shoulderWidth,
                    confidence: getConfidence(point),
                };
            });
        }
    }

    return {
        angles,
        relativeLandmarks,
        visibleLandmarks,
        landmarkConfidence,
    };
}
