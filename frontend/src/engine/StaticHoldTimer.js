export default class StaticHoldTimer {
    constructor(targetSeconds) {
        this.targetSeconds = Math.max(1, Number(targetSeconds) || 1);

        this.accumulatedMs = 0;
        this.runningSince = null;
        this.userEnabled = false;
        this.poseValid = false;
    }

    updatePoseValidity(isValid, now = performance.now()) {
        if (this.poseValid === isValid) {
            return this.snapshot(now);
        }

        if (!isValid && this.runningSince !== null) {
            this.accumulatedMs += Math.max(0, now - this.runningSince);

            this.runningSince = null;
            this.userEnabled = false;
        }

        this.poseValid = isValid;

        if (isValid && this.userEnabled && this.runningSince === null) {
            this.runningSince = now;
        }

        return this.snapshot(now);
    }

    resume(now = performance.now()) {
        if (!this.poseValid) {
            return this.snapshot(now);
        }

        this.userEnabled = true;

        if (this.runningSince === null) {
            this.runningSince = now;
        }

        return this.snapshot(now);
    }

    pause(now = performance.now()) {
        if (this.runningSince !== null) {
            this.accumulatedMs += Math.max(0, now - this.runningSince);

            this.runningSince = null;
        }

        this.userEnabled = false;

        return this.snapshot(now);
    }

    reset(now = performance.now()) {
        this.accumulatedMs = 0;
        this.runningSince = null;
        this.userEnabled = false;

        return this.snapshot(now);
    }

    snapshot(now = performance.now()) {
        const elapsedMs =
            this.accumulatedMs +
            (this.runningSince === null
                ? 0
                : Math.max(0, now - this.runningSince));

        const elapsedSeconds = elapsedMs / 1000;
        const completed = elapsedSeconds >= this.targetSeconds;

        let status = "POSE_NOT_MATCHED";

        if (completed) {
            status = "COMPLETED";
        } else if (this.runningSince !== null) {
            status = "HOLDING";
        } else if (this.poseValid) {
            status = "READY";
        }

        return {
            elapsedSeconds,
            elapsedWholeSeconds: Math.floor(elapsedSeconds),
            targetSeconds: this.targetSeconds,
            progress: Math.min(
                100,
                (elapsedSeconds / this.targetSeconds) * 100,
            ),
            isRunning: this.runningSince !== null,
            userEnabled: this.userEnabled,
            poseValid: this.poseValid,
            completed,
            status,
        };
    }
}
