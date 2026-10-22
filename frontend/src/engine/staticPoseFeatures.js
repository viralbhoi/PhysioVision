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

export function extractStaticPoseFeatures(worldLandmarks, normalizedLandmarks) {
    if (!worldLandmarks || !normalizedLandmarks) {
        return {
            angles: [],
            relativeLandmarks: [],
            visibleLandmarks: 0,
        };
    }

    const angles = [];

    for (const joint of JOINTS) {
        const points = [
            worldLandmarks[joint.a],
            worldLandmarks[joint.b],
            worldLandmarks[joint.c],
        ];

        if (!points.every((point) => isVisible(point))) {
            continue;
        }

        const value = calculateAngle(...points);

        if (Number.isFinite(value)) {
            angles.push({
                name: joint.name,
                value,
            });
        }
    }

    const visibleLandmarks = normalizedLandmarks.filter((point) =>
        isVisible(point),
    ).length;

    const leftHip = normalizedLandmarks[23];
    const rightHip = normalizedLandmarks[24];
    const leftShoulder = normalizedLandmarks[11];
    const rightShoulder = normalizedLandmarks[12];

    let relativeLandmarks = [];

    if (
        [leftHip, rightHip, leftShoulder, rightShoulder].every((point) =>
            isVisible(point),
        )
    ) {
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

        relativeLandmarks = normalizedLandmarks.map((point, index) => ({
            index,
            x: isVisible(point) ? (point.x - origin.x) / scale : null,
            y: isVisible(point) ? (point.y - origin.y) / scale : null,
            z: isVisible(point) ? ((point.z || 0) - origin.z) / scale : null,
        }));
    }

    return {
        angles,
        relativeLandmarks,
        visibleLandmarks,
    };
}
