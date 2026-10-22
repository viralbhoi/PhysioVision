import { useEffect, useMemo, useState } from "react";
import StaticHoldTimer from "../engine/StaticHoldTimer";

const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(seconds));

    const minutes = String(Math.floor(value / 60)).padStart(2, "0");

    const remainder = String(value % 60).padStart(2, "0");

    return `${minutes}:${remainder}`;
};

export default function StaticYogaHoldPanel({
    result,
    targetHoldSeconds = 30,
    onStateChange,
}) {
    const timer = useMemo(
        () => new StaticHoldTimer(targetHoldSeconds),
        [targetHoldSeconds],
    );

    const [snapshot, setSnapshot] = useState(() => timer.snapshot());

    const poseValid = Boolean(
        result?.isPoseMatched && result?.trackingReliable,
    );

    useEffect(() => {
        const next = timer.updatePoseValidity(poseValid, performance.now());

        setSnapshot(next);
        onStateChange?.(next);
    }, [poseValid, timer, onStateChange]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const next = timer.snapshot(performance.now());

            setSnapshot(next);
            onStateChange?.(next);
        }, 200);

        return () => window.clearInterval(intervalId);
    }, [timer, onStateChange]);

    const handleResume = () => {
        const next = timer.resume(performance.now());

        setSnapshot(next);
        onStateChange?.(next);
    };

    const handlePause = () => {
        const next = timer.pause(performance.now());

        setSnapshot(next);
        onStateChange?.(next);
    };

    const handleReset = () => {
        const next = timer.reset(performance.now());

        setSnapshot(next);
        onStateChange?.(next);
    };

    const score = Number.isFinite(result?.score) ? result.score : 0;

    const canResume = poseValid && !snapshot.completed && !snapshot.userEnabled;

    return (
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Static yoga pose
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                        Hold your posture
                    </h2>
                </div>

                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        snapshot.completed
                            ? "bg-emerald-100 text-emerald-700"
                            : snapshot.isRunning
                              ? "bg-blue-100 text-blue-700"
                              : poseValid
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                    }`}
                >
                    {snapshot.completed
                        ? "Completed"
                        : snapshot.isRunning
                          ? "Holding"
                          : poseValid
                            ? "Ready"
                            : "Timer paused"}
                </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Posture match</p>

                    <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                        {score}%
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Required: {result?.matchThreshold ?? 75}%
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Valid hold time</p>

                    <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                        {formatTime(snapshot.elapsedWholeSeconds)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Target: {formatTime(snapshot.targetSeconds)}
                    </p>
                </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
                    style={{
                        width: `${snapshot.progress}%`,
                    }}
                />
            </div>

            <p
                className={`mt-3 text-sm ${
                    !result?.trackingReliable
                        ? "text-amber-700"
                        : poseValid
                          ? "text-emerald-700"
                          : "text-slate-600"
                }`}
            >
                {!result?.trackingReliable
                    ? "Tracking is unreliable. Make sure your body is visible."
                    : poseValid
                      ? "Pose is within the matching threshold."
                      : "Pose match is below the threshold. The timer is paused and your accumulated time is preserved."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleResume}
                    disabled={!canResume}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    Resume timer
                </button>

                <button
                    type="button"
                    onClick={handlePause}
                    disabled={!snapshot.userEnabled || snapshot.completed}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Pause
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                    Reset timer
                </button>
            </div>

            {snapshot.completed && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    Target hold duration reached. You can finish the session or
                    reset the timer for another attempt.
                </div>
            )}
        </section>
    );
}
