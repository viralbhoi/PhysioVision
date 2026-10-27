import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PoseTracker from "../components/PoseTracker";
import StaticYogaPoseTracker from "../components/StaticYogaPoseTracker";
import ExerciseReferenceMedia from "../components/ExerciseReferenceMedia";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

function formatTime(seconds = 0) {
    const value = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(value / 60);
    const remainder = Math.floor(value % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getExerciseName(exercise) {
    return exercise?.name || exercise?.title || "Exercise";
}

function isStaticPose(exercise) {
    return exercise?.category === "YOGA" && exercise?.trackingMode === "STATIC";
}

export default function GeneralizedSessionExercise() {
    const { inviteCode } = useParams();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [resultsByExercise, setResultsByExercise] = useState({});
    const [completedExerciseKeys, setCompletedExerciseKeys] = useState({});
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function loadSession() {
            setLoading(true);
            setError("");

            try {
                // Public endpoint: no bearer token or login required.
                const response = await fetch(
                    `${API_BASE_URL}/generalized-sessions/join/${encodeURIComponent(inviteCode || "")}`,
                    { signal: controller.signal },
                );
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load this shared session.",
                    );
                }

                const sessionData = data.session || data.data?.session || data;

                if (!Array.isArray(sessionData?.exercises)) {
                    throw new Error(
                        "The session response did not include its exercise list.",
                    );
                }

                setSession(sessionData);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "Unable to load this session.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        loadSession();
        return () => controller.abort();
    }, [inviteCode]);

    useEffect(() => {
        if (loading || error || finished) return undefined;

        const timer = window.setInterval(() => {
            setElapsedSeconds((seconds) => seconds + 1);
        }, 1000);

        return () => window.clearInterval(timer);
    }, [loading, error, finished]);

    const exercises = session?.exercises || [];
    const exercise = exercises[activeIndex] || null;
    const exerciseKey = exercise?._id || exercise?.id || `${activeIndex}`;
    const latestResult = resultsByExercise[exerciseKey] || {};

    const handleResult = useCallback(
        (result) => {
            if (!result) return;
            setResultsByExercise((previous) => ({
                ...previous,
                [exerciseKey]: result,
            }));
        },
        [exerciseKey],
    );

    const goToExercise = (nextIndex) => {
        setActiveIndex(Math.max(0, Math.min(exercises.length - 1, nextIndex)));
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12">
                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <p className="font-semibold text-slate-800">
                        Loading shared session…
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Preparing the exercise instructions and tracker.
                    </p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12">
                <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
                    <h1 className="text-xl font-bold text-slate-900">
                        Unable to open session
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-red-700">
                        {error}
                    </p>
                    <Link
                        to={`/join-session/${encodeURIComponent(inviteCode || "")}`}
                        className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Return to join page
                    </Link>
                </div>
            </main>
        );
    }

    if (finished) {
        const completedRows = exercises
            .map((item, index) => {
                const key = item?._id || item?.id || `${index}`;
                return completedExerciseKeys[key]
                    ? {
                          exercise: item,
                          result: resultsByExercise[key] || {},
                          key,
                      }
                    : null;
            })
            .filter(Boolean);
        const totalReps = completedRows.reduce(
            (sum, row) =>
                sum +
                Math.max(
                    0,
                    Number(row.result?.reps ?? row.result?.completedReps ?? 0),
                ),
            0,
        );
        const scoredRows = completedRows
            .map((row) =>
                Number(
                    row.result?.poseMatchScore ??
                        row.result?.score ??
                        row.result?.averageScore,
                ),
            )
            .filter((score) => Number.isFinite(score) && score > 0);
        const averageScore = scoredRows.length
            ? Math.round(
                  scoredRows.reduce((sum, score) => sum + score, 0) /
                      scoredRows.length,
              )
            : null;
        const totalHoldSeconds = completedRows.reduce(
            (sum, row) =>
                sum +
                Math.max(
                    0,
                    Number(
                        row.result?.holdSeconds ?? row.result?.heldSeconds ?? 0,
                    ),
                ),
            0,
        );

        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12">
                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <svg
                            viewBox="0 0 24 24"
                            className="h-7 w-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >
                            <path d="m5 12 4 4L19 6" />
                            <circle cx="12" cy="12" r="9" />
                        </svg>
                    </div>
                    <h1 className="mt-5 text-2xl font-bold text-slate-950">
                        Exercise session finished
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        You have finished this shared exercise session. Your
                        live tracking results were kept only in this browser and
                        were not saved to the database.
                    </p>
                    <div className="mt-6 rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Session</p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {session?.title || "Shared exercise session"}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Time spent: {formatTime(elapsedSeconds)}
                        </p>
                    </div>

                    <section className="mt-6">
                        <h2 className="text-lg font-bold text-slate-950">
                            Temporary progress report
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            This report is generated in this browser and is not
                            stored in the database.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <SummaryMetric
                                label="Exercises completed"
                                value={`${completedRows.length} / ${exercises.length}`}
                            />
                            <SummaryMetric
                                label="Total repetitions"
                                value={String(totalReps)}
                            />
                            <SummaryMetric
                                label="Average score"
                                value={
                                    averageScore === null
                                        ? "—"
                                        : `${averageScore}%`
                                }
                            />
                            <SummaryMetric
                                label="Total hold time"
                                value={formatTime(totalHoldSeconds)}
                            />
                        </div>
                        <div className="mt-4 space-y-3">
                            {completedRows.length ? (
                                completedRows.map(
                                    ({ exercise: item, result, key }) => {
                                        const score =
                                            result?.poseMatchScore ??
                                            result?.score ??
                                            result?.averageScore;
                                        const reps =
                                            result?.reps ??
                                            result?.completedReps;
                                        const hold =
                                            result?.holdSeconds ??
                                            result?.heldSeconds;
                                        return (
                                            <article
                                                key={key}
                                                className="rounded-xl border border-slate-200 p-4 text-left"
                                            >
                                                <h3 className="font-semibold text-slate-900">
                                                    {getExerciseName(item)}
                                                </h3>
                                                <p className="mt-2 text-sm text-slate-600">
                                                    {reps != null
                                                        ? `Repetitions: ${reps}`
                                                        : "Repetitions: not reported"}
                                                    {score != null
                                                        ? ` · Score: ${Math.round(Number(score))}%`
                                                        : " · Score: not reported"}
                                                    {hold != null
                                                        ? ` · Hold: ${formatTime(hold)}`
                                                        : ""}
                                                </p>
                                            </article>
                                        );
                                    },
                                )
                            ) : (
                                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                                    No exercises were marked complete, so there
                                    are no completed exercise results to
                                    summarize.
                                </p>
                            )}
                        </div>
                    </section>
                    <Link
                        to={`/join-session/${encodeURIComponent(inviteCode || "")}`}
                        className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Back to session invite
                    </Link>
                </div>
            </main>
        );
    }

    if (!exercise) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12">
                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <h1 className="text-xl font-bold text-slate-900">
                        {session?.title || "Shared session"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        No exercises are currently included in this session.
                    </p>
                    <Link
                        to={`/join-session/${encodeURIComponent(inviteCode || "")}`}
                        className="mt-5 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
                    >
                        Back to invite
                    </Link>
                </div>
            </main>
        );
    }

    const staticPose = isStaticPose(exercise);
    const currentScore = Number(
        latestResult?.poseMatchScore ?? latestResult?.score ?? 0,
    );
    const currentReps = Number(latestResult?.reps ?? 0);
    const holdSeconds = Number(
        latestResult?.holdSeconds ?? latestResult?.heldSeconds ?? 0,
    );
    const targetHoldSeconds = Number(
        latestResult?.targetHoldSeconds ?? exercise?.targetHoldSeconds ?? 0,
    );

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                                PhysioVision · Guest session
                            </p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                {session?.title || "Shared exercise session"}
                            </h1>
                            {session?.description && (
                                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                    {session.description}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0 gap-3">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">
                                    Exercise
                                </p>
                                <p className="mt-1 text-lg font-bold tabular-nums">
                                    {activeIndex + 1}{" "}
                                    <span className="text-sm font-medium text-slate-400">
                                        / {exercises.length}
                                    </span>
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-900 px-4 py-3 text-white">
                                <p className="text-xs text-slate-400">
                                    Time here
                                </p>
                                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                                    {formatTime(elapsedSeconds)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {exercises.map((item, index) => (
                            <button
                                key={item?._id || item?.id || index}
                                type="button"
                                onClick={() => goToExercise(index)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    index === activeIndex
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                                aria-current={
                                    index === activeIndex ? "step" : undefined
                                }
                            >
                                {index + 1}. {getExerciseName(item)}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-5 w-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 11v5m0-8h.01" />
                    </svg>
                    <p>
                        Guest mode: no account is required. Camera-based
                        tracking runs in your browser. Reps, hold time, scores,
                        and completion state are temporary and are not saved to
                        the database.
                    </p>
                </div>

                <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                Exercise {activeIndex + 1}
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                                {getExerciseName(exercise)}
                            </h2>
                            {exercise?.description && (
                                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                    {exercise.description}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {exercise?.category || "PHYSIOTHERAPY"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {exercise?.trackingMode || "DYNAMIC"}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Reference media (30%) + live tracking (70%) */}
                <section className="mb-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[30fr_70fr]">
                    <div className="min-w-0">
                        <ExerciseReferenceMedia exercise={exercise} />
                    </div>

                    <div className="min-w-0">
                        {staticPose ? (
                            <StaticYogaPoseTracker
                                key={exerciseKey}
                                exercise={exercise}
                                onResult={handleResult}
                            />
                        ) : (
                            <PoseTracker
                                key={exerciseKey}
                                exercise={exercise}
                                onResult={handleResult}
                            />
                        )}
                    </div>
                </section>

                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {staticPose ? (
                        <>
                            <Metric
                                label="Pose match"
                                value={`${Math.round(currentScore)}%`}
                                description={
                                    latestResult?.status ||
                                    "Align your body with the reference pose."
                                }
                            />
                            <Metric
                                label="Hold time"
                                value={formatTime(holdSeconds)}
                                description="Current valid hold duration (local only)."
                            />
                            <Metric
                                label="Target hold"
                                value={formatTime(targetHoldSeconds)}
                                description={
                                    latestResult?.holdCompleted
                                        ? "Target hold reached."
                                        : "Follow the pose tracker guidance."
                                }
                            />
                        </>
                    ) : (
                        <>
                            <Metric
                                label="Repetitions"
                                value={String(currentReps)}
                                description="Live count from the tracker; not saved."
                            />
                            <Metric
                                label="Movement score"
                                value={`${Math.round(currentScore)}%`}
                                description="Current tracking feedback."
                            />
                            <Metric
                                label="Movement phase"
                                value={String(latestResult?.phase || "READY")}
                                description="Current tracker phase."
                            />
                        </>
                    )}
                </section>

                <footer className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
                    <button
                        type="button"
                        onClick={() => goToExercise(activeIndex - 1)}
                        disabled={activeIndex === 0}
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ← Previous exercise
                    </button>

                    <p className="text-center text-xs text-slate-500">
                        Progress is temporary. Finishing does not write results
                        to the database.
                    </p>

                    {activeIndex < exercises.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => {
                                setCompletedExerciseKeys((previous) => ({
                                    ...previous,
                                    [exerciseKey]: true,
                                }));
                                goToExercise(activeIndex + 1);
                            }}
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Next exercise →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setCompletedExerciseKeys((previous) => ({
                                    ...previous,
                                    [exerciseKey]: true,
                                }));
                                setFinished(true);
                            }}
                            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Finish session
                        </button>
                    )}
                </footer>
            </div>
        </main>
    );
}

function SummaryMetric({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
        </div>
    );
}

function Metric({ label, value, description }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 wrap-break-word text-2xl font-bold tracking-tight text-slate-950">
                {value}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
                {description}
            </p>
        </div>
    );
}
