// frontend/src/exercise/featureCalculator.js

/**
 * Calculate the angle ABC.
 *
 * A, B and C are MediaPipe landmarks.
 * B is the vertex of the angle.
 */
export function calculateAngle(A, B, C) {
    if (!A || !B || !C) {
        return null;
    }

    const radians =
        Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);

    let angle = Math.abs((radians * 180) / Math.PI);

    if (angle > 180) {
        angle = 360 - angle;
    }

    return angle;
}

/**
 * Calculate distance between two landmarks.
 */
export function calculateDistance(A, B) {
    if (!A || !B) {
        return null;
    }

    const dx = A.x - B.x;
    const dy = A.y - B.y;

    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * MediaPipe Pose landmark indexes.
 */
export const LANDMARKS = {
    NOSE: 0,

    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,

    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,

    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,

    LEFT_HIP: 23,
    RIGHT_HIP: 24,

    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,

    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
};

/**
 * Calculate commonly useful body features.
 *
 * Returns only features that can be calculated
 * from the currently available landmarks.
 */
export function calculateFeatures(landmarks) {
    if (!landmarks || landmarks.length === 0) {
        return null;
    }

    const L = LANDMARKS;

    return {
        // Arms
        leftElbowAngle: calculateAngle(
            landmarks[L.LEFT_SHOULDER],
            landmarks[L.LEFT_ELBOW],
            landmarks[L.LEFT_WRIST],
        ),

        rightElbowAngle: calculateAngle(
            landmarks[L.RIGHT_SHOULDER],
            landmarks[L.RIGHT_ELBOW],
            landmarks[L.RIGHT_WRIST],
        ),

        // Legs
        leftKneeAngle: calculateAngle(
            landmarks[L.LEFT_HIP],
            landmarks[L.LEFT_KNEE],
            landmarks[L.LEFT_ANKLE],
        ),

        rightKneeAngle: calculateAngle(
            landmarks[L.RIGHT_HIP],
            landmarks[L.RIGHT_KNEE],
            landmarks[L.RIGHT_ANKLE],
        ),

        // Hip
        leftHipAngle: calculateAngle(
            landmarks[L.LEFT_SHOULDER],
            landmarks[L.LEFT_HIP],
            landmarks[L.LEFT_KNEE],
        ),

        rightHipAngle: calculateAngle(
            landmarks[L.RIGHT_SHOULDER],
            landmarks[L.RIGHT_HIP],
            landmarks[L.RIGHT_KNEE],
        ),

        // Shoulder
        leftShoulderAngle: calculateAngle(
            landmarks[L.LEFT_ELBOW],
            landmarks[L.LEFT_SHOULDER],
            landmarks[L.LEFT_HIP],
        ),

        rightShoulderAngle: calculateAngle(
            landmarks[L.RIGHT_ELBOW],
            landmarks[L.RIGHT_SHOULDER],
            landmarks[L.RIGHT_HIP],
        ),
    };
}
