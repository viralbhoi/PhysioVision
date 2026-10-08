class DTWMatcher {
    constructor({
        window = null,
    } = {}) {
        this.window = window;
    }

    // =========================================================
    // Distance between two trajectory points
    // =========================================================

    distance(a, b) {
        if (!a || !b) {
            return Infinity;
        }

        const keys = new Set([
            ...Object.keys(a),
            ...Object.keys(b),
        ]);

        let sum = 0;
        let count = 0;

        for (const key of keys) {
            const valueA = a[key];
            const valueB = b[key];

            if (
                !Number.isFinite(valueA) ||
                !Number.isFinite(valueB)
            ) {
                continue;
            }

            const difference =
                valueA - valueB;

            sum +=
                difference *
                difference;

            count++;
        }

        if (count === 0) {
            return Infinity;
        }

        return Math.sqrt(
            sum / count
        );
    }

    // =========================================================
    // Dynamic Time Warping
    // =========================================================

    calculate(
        reference,
        user
    ) {
        if (
            !reference?.length ||
            !user?.length
        ) {
            return Infinity;
        }

        const n =
            reference.length;

        const m =
            user.length;

        const dp = Array.from(
            { length: n + 1 },
            () =>
                Array(
                    m + 1
                ).fill(Infinity)
        );

        dp[0][0] = 0;

        for (
            let i = 1;
            i <= n;
            i++
        ) {
            let start = 1;
            let end = m;

            if (
                this.window !== null
            ) {
                start = Math.max(
                    1,
                    i - this.window
                );

                end = Math.min(
                    m,
                    i + this.window
                );
            }

            for (
                let j = start;
                j <= end;
                j++
            ) {
                const cost =
                    this.distance(
                        reference[
                            i - 1
                        ],
                        user[j - 1]
                    );

                const previous =
                    Math.min(
                        dp[i - 1][j],
                        dp[i][j - 1],
                        dp[i - 1][j - 1]
                    );

                dp[i][j] =
                    cost + previous;
            }
        }

        const distance =
            dp[n][m];

        if (
            !Number.isFinite(
                distance
            )
        ) {
            return Infinity;
        }

        // Normalize by path length
        return (
            distance /
            (n + m)
        );
    }

    // =========================================================
    // Distance → 0–100 similarity
    // =========================================================

    similarity(
        reference,
        user
    ) {
        const distance =
            this.calculate(
                reference,
                user
            );

        if (
            !Number.isFinite(
                distance
            )
        ) {
            return 0;
        }

        /*
         * Inputs are normalized
         * approximately to 0–1.
         *
         * Therefore:
         *
         * 0.00 error → 100
         * 0.10 error → ~78
         * 0.25 error → ~54
         * 0.50 error → ~29
         */
        const score =
            100 *
            Math.exp(
                -distance * 2.5
            );

        return Math.max(
            0,
            Math.min(
                100,
                score
            )
        );
    }
}

export default DTWMatcher;