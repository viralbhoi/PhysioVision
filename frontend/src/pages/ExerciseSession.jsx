import { useCallback, useEffect, useRef, useState } from "react";

import PoseTracker from "../components/PoseTracker";
import StaticYogaPoseTracker from "../components/StaticYogaPoseTracker";
import ExerciseReferenceMedia from "../components/ExerciseReferenceMedia";
import SessionSummary from "./SessionSummary";

import { startSession, completeSession } from "../services/api";

function ExerciseSession({ assignment, onBack }) {
    const exercise = assignment?.exercise;

    const isStaticYoga =
        exercise?.category === "YOGA" && exercise?.trackingMode === "STATIC";

    const [session, setSession] = useState(null);
    const [latestResult, setLatestResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [error, setError] = useState("");
    const [completedSession, setCompletedSession] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const startTimeRef = useRef(null);
    const timerRef = useRef(null);
    const mountedRef = useRef(true);

    // =========================================================
    // Start backend session and elapsed-time timer
    // =========================================================

    useEffect(() => {
        let mounted = true;

        const initializeSession = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await startSession(assignment._id);

                if (!mounted) return;

                if (!response?.session?._id) {
                    throw new Error(
                        "The server did not return a valid session.",
                    );
                }

                setSession(response.session);
                startTimeRef.current = Date.now();

                timerRef.current = setInterval(() => {
                    if (!startTimeRef.current) return;

                    setElapsedSeconds(
                        Math.floor((Date.now() - startTimeRef.current) / 1000),
                    );
                }, 1000);

                setLoading(false);
            } catch (err) {
                console.error("Unable to start session:", err);

                if (!mounted) return;

                setError(err.message || "Unable to start exercise session.");
                setLoading(false);
            }
        };

        initializeSession();

        return () => {
            mounted = false;

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [assignment._id]);

    // =========================================================
    // Receive tracker results
    //
    // Dynamic result:
    // { reps, score, averageScore, repScores, phase }
    //
    // Static result:
    // { holdSeconds, targetHoldSeconds, score,
    //   poseMatchScore, holdCompleted, status }
    // =========================================================

    const handleResult = useCallback((result) => {
        if (!result) return;
        setLatestResult(result);
    }, []);

    // =========================================================
    // Finish and persist session
    // =========================================================

    const handleFinish = async () => {
        if (!session || finishing || completedSession) return;

        try {
            setFinishing(true);
            setError("");

            const completedReps = isStaticYoga
                ? 0
                : Number(latestResult?.reps ?? 0);

            const averageScore = Number(
                latestResult?.averageScore ??
                    latestResult?.poseMatchScore ??
                    latestResult?.score ??
                    0,
            );

            const repScores = Array.isArray(latestResult?.repScores)
                ? latestResult.repScores
                : [];

            const sessionPayload = {
                completedReps,
                averageScore,
                repScores,
                duration: elapsedSeconds,
            };

            // Additional static-yoga fields.
            // The backend model/service must explicitly persist these.
            if (isStaticYoga) {
                sessionPayload.targetHoldSeconds = Number(
                    latestResult?.targetHoldSeconds ??
                        exercise?.targetHoldSeconds ??
                        0,
                );

                sessionPayload.holdDuration = Number(
                    latestResult?.holdSeconds ?? latestResult?.heldSeconds ?? 0,
                );

                sessionPayload.poseMatchScore = Number(
                    latestResult?.poseMatchScore ?? latestResult?.score ?? 0,
                );

                sessionPayload.holdCompleted = Boolean(
                    latestResult?.holdCompleted,
                );
            }

            const response = await completeSession(session._id, sessionPayload);

            if (!response?.session) {
                throw new Error(
                    "The server did not return the completed session.",
                );
            }

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            startTimeRef.current = null;
            setCompletedSession(response.session);
        } catch (err) {
            console.error("Unable to complete session:", err);

            setError(err.message || "Unable to complete session.");
            setFinishing(false);
        }
    };

    // =========================================================
    // Loading state
    // =========================================================

    if (loading) {
        return (
            <div className="exercise-session">
                <div className="session-loading">Starting exercise...</div>
            </div>
        );
    }

    // =========================================================
    // Session initialization error
    // =========================================================

    if (error && !session) {
        return (
            <div className="exercise-session">
                <div className="session-error">
                    <p>{error}</p>

                    <button type="button" onClick={onBack}>
                        Back
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // Completed session summary
    // =========================================================

    if (completedSession) {
        return (
            <SessionSummary
                session={completedSession}
                assignment={assignment}
                onBack={onBack}
            />
        );
    }

    // =========================================================
    // Derived metrics
    // =========================================================

    const targetReps = Number(assignment?.targetReps ?? 0);

    const targetHoldSeconds = Number(
        latestResult?.targetHoldSeconds ?? exercise?.targetHoldSeconds ?? 0,
    );

    const completedReps = Number(latestResult?.reps ?? 0);

    const currentScore = Number(
        latestResult?.poseMatchScore ?? latestResult?.score ?? 0,
    );

    const heldSeconds = Number(
        latestResult?.holdSeconds ?? latestResult?.heldSeconds ?? 0,
    );

    // =========================================================
    // Active session
    // =========================================================

    return (
        <div className="exercise-session min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <header className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={finishing}
                            className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50"
                        >
                            ← Back
                        </button>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {exercise?.name || "Exercise"}
                        </h1>

                        {exercise?.description && (
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                                {exercise.description}
                            </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {isStaticYoga
                                    ? "Static Yoga"
                                    : exercise?.category === "YOGA"
                                      ? "Dynamic Yoga"
                                      : "Physiotherapy"}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {isStaticYoga
                                    ? "Pose holding"
                                    : "Repetition tracking"}
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-white">
                        <p className="text-xs font-medium text-slate-400">
                            Session duration
                        </p>

                        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                            {formatTime(elapsedSeconds)}
                        </p>
                    </div>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {/* Reference media */}
                <div className="mb-6">
                    <ExerciseReferenceMedia exercise={exercise} />
                </div>

                {/* Main tracking panel */}
                <section className="mb-6">
                    {isStaticYoga ? (
                        <StaticYogaPoseTracker
                            key={session?._id || assignment._id}
                            exercise={exercise}
                            onResult={handleResult}
                            disabled={finishing}
                        />
                    ) : (
                        <PoseTracker
                            key={session?._id || assignment._id}
                            exercise={exercise}
                            onResult={handleResult}
                        />
                    )}
                </section>

                {/* Live results */}
                {isStaticYoga ? (
                    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard
                            label="Pose match"
                            value={`${Math.round(currentScore)}%`}
                            description={
                                latestResult?.status ||
                                "Align your body with the reference pose."
                            }
                        />

                        <MetricCard
                            label="Valid hold"
                            value={formatTime(heldSeconds)}
                            description="Time counted while your pose is valid."
                        />

                        <MetricCard
                            label="Target hold"
                            value={formatTime(targetHoldSeconds)}
                            description={
                                latestResult?.holdCompleted
                                    ? "Target hold completed."
                                    : "Maintain the pose until the target is reached."
                            }
                        />
                    </section>
                ) : (
                    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard
                            label="Repetitions"
                            value={`${completedReps}/${targetReps}`}
                            description="Completed repetitions"
                        />

                        <MetricCard
                            label="Current score"
                            value={`${Math.round(currentScore)}%`}
                            description="Live movement/form score"
                        />

                        <MetricCard
                            label="Movement phase"
                            value={latestResult?.phase ?? "RESTING"}
                            description="Current tracking phase"
                        />
                    </section>
                )}

                {/* Assignment target */}
                <section className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="text-sm text-slate-500">
                        Prescription:
                    </span>

                    {isStaticYoga ? (
                        <>
                            <strong className="text-sm text-slate-900">
                                {formatTime(
                                    Number(exercise?.targetHoldSeconds ?? 0),
                                )}{" "}
                                target hold
                            </strong>
                        </>
                    ) : (
                        <>
                            <strong className="text-sm text-slate-900">
                                {targetReps} reps
                            </strong>

                            <span className="text-slate-300">•</span>

                            <strong className="text-sm text-slate-900">
                                {assignment?.sets ?? 1} sets
                            </strong>
                        </>
                    )}

                    {assignment?.notes && (
                        <p className="basis-full border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
                            <strong>Physiotherapist's instructions:</strong>{" "}
                            {assignment.notes}
                        </p>
                    )}
                </section>

                {/* Finish */}
                <footer className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <p className="font-semibold text-slate-900">
                            Ready to finish?
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Your session results will be submitted for progress
                            tracking.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleFinish}
                        disabled={finishing || !session}
                    >
                        {finishing ? "Saving session..." : "Finish session"}
                    </button>
                </footer>
            </div>
        </div>
    );
}

// =============================================================
// Reusable metric card
// =============================================================

function MetricCard({ label, value, description }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>

            <p className="mt-2 wrap-break-word text-2xl font-bold tracking-tight text-slate-900">
                {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
                {description}
            </p>
        </div>
    );
}

// =============================================================
// Helpers
// =============================================================

function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds,
    ).padStart(2, "0")}`;
}

export default ExerciseSession;
