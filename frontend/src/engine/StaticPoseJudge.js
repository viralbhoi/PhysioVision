const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function angleScore(reference, current, tolerance) {
    const difference = Math.abs(reference - current);

    return clamp(100 * (1 - difference / tolerance), 0, 100);
}

function landmarkScore(reference, current, tolerance) {
    const distance = Math.hypot(
        reference.x - current.x,
        reference.y - current.y,
        (reference.z || 0) - (current.z || 0),
    );

    return clamp(100 * (1 - distance / tolerance), 0, 100);
}

export default class StaticPoseJudge {
    constructor({
        referencePose,
        matchThreshold = 75,
        minimumVisibleLandmarks = 20,
        angleTolerance = 45,
        landmarkTolerance = 0.8,
    }) {
        if (!referencePose?.angles?.length) {
            throw new Error(
                "Static pose reference is missing calibrated angles.",
            );
        }

        this.referencePose = referencePose;
        this.matchThreshold = clamp(Number(matchThreshold) || 75, 1, 100);
        this.minimumVisibleLandmarks = minimumVisibleLandmarks;
        this.angleTolerance = angleTolerance;
        this.landmarkTolerance = landmarkTolerance;
    }

    evaluate({ angles = [], relativeLandmarks = [], visibleLandmarks = 0 }) {
        const currentAngles = new Map(
            angles.map((item) => [item.name, item.value]),
        );

        const angleScores = [];

        for (const reference of this.referencePose.angles) {
            const current = currentAngles.get(reference.name);

            if (Number.isFinite(current) && Number.isFinite(reference.value)) {
                angleScores.push(
                    angleScore(reference.value, current, this.angleTolerance),
                );
            }
        }

        const currentPoints = new Map(
            relativeLandmarks
                .filter(
                    (point) =>
                        Number.isFinite(point.x) && Number.isFinite(point.y),
                )
                .map((point) => [point.index, point]),
        );

        const landmarkScores = [];

        for (const reference of this.referencePose.relativeLandmarks || []) {
            if (
                !Number.isFinite(reference.x) ||
                !Number.isFinite(reference.y)
            ) {
                continue;
            }

            const current = currentPoints.get(reference.index);

            if (!current) continue;

            landmarkScores.push(
                landmarkScore(reference, current, this.landmarkTolerance),
            );
        }

        const enoughAngles =
            angleScores.length >= Math.min(4, this.referencePose.angles.length);

        const trackingReliable =
            visibleLandmarks >= this.minimumVisibleLandmarks && enoughAngles;

        if (!trackingReliable) {
            return {
                score: 0,
                matchThreshold: this.matchThreshold,
                isPoseMatched: false,
                trackingReliable: false,
                visibleLandmarks,
                comparedAngles: angleScores.length,
                comparedLandmarks: landmarkScores.length,
                status: "TRACKING_UNRELIABLE",
            };
        }

        const averageAngles =
            angleScores.reduce((sum, score) => sum + score, 0) /
            angleScores.length;

        const averageLandmarks = landmarkScores.length
            ? landmarkScores.reduce((sum, score) => sum + score, 0) /
              landmarkScores.length
            : averageAngles;

        const score = Math.round(
            averageAngles * 0.75 + averageLandmarks * 0.25,
        );

        const isPoseMatched = score >= this.matchThreshold;

        return {
            score,
            matchThreshold: this.matchThreshold,
            isPoseMatched,
            trackingReliable: true,
            visibleLandmarks,
            comparedAngles: angleScores.length,
            comparedLandmarks: landmarkScores.length,
            status: isPoseMatched ? "POSE_MATCHED" : "ADJUST_POSE",
        };
    }
}
