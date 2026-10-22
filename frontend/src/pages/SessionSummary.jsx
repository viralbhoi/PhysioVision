function SessionSummary({ session, assignment, onBack }) {
    const targetReps = assignment?.targetReps ?? session?.targetReps ?? 0;

    const completedReps = session?.completedReps ?? 0;

    const averageScore = Math.round(session?.averageScore ?? 0);

    const duration = session?.duration ?? 0;

    const repScores = session?.repScores ?? [];

    const completionPercentage =
        targetReps > 0
            ? Math.min(100, Math.round((completedReps / targetReps) * 100))
            : 0;

    const scoreLabel =
        averageScore >= 85
            ? "Excellent"
            : averageScore >= 70
              ? "Good"
              : averageScore >= 50
                ? "Completed"
                : "Keep Practicing";

    return (
        <div className="min-h-full bg-slate-50">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ================================================= */}
                {/* Header */}
                {/* ================================================= */}

                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg
                            className="h-7 w-7"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m6 12 4 4 8-8"
                            />
                        </svg>
                    </div>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Exercise Complete
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                        {assignment?.exercise?.name || "Exercise Session"}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Your session has been recorded successfully.
                    </p>
                </div>

                {/* ================================================= */}
                {/* Main Score */}
                {/* ================================================= */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col items-center">
                            <p className="text-sm font-medium text-slate-500">
                                Overall Score
                            </p>

                            <div className="mt-2 flex items-baseline">
                                <span
                                    className={`text-6xl font-semibold tracking-tight ${
                                        averageScore >= 70
                                            ? "text-emerald-600"
                                            : averageScore >= 50
                                              ? "text-amber-600"
                                              : "text-red-600"
                                    }`}
                                >
                                    {averageScore}
                                </span>

                                <span className="ml-2 text-lg font-medium text-slate-400">
                                    / 100
                                </span>
                            </div>

                            <span
                                className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                                    averageScore >= 85
                                        ? "bg-emerald-50 text-emerald-700"
                                        : averageScore >= 70
                                          ? "bg-blue-50 text-blue-700"
                                          : averageScore >= 50
                                            ? "bg-amber-50 text-amber-700"
                                            : "bg-red-50 text-red-700"
                                }`}
                            >
                                {scoreLabel}
                            </span>
                        </div>

                        {/* Rep completion */}
                        <div className="mx-auto mt-8 max-w-xl">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">
                                    Repetition completion
                                </span>

                                <span className="text-sm font-semibold text-slate-900">
                                    {completedReps} / {targetReps}
                                </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all"
                                    style={{
                                        width: `${completionPercentage}%`,
                                    }}
                                />
                            </div>

                            <p className="mt-2 text-right text-xs text-slate-400">
                                {completionPercentage}% completed
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================================================= */}
                {/* Stats */}
                {/* ================================================= */}

                <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryStat label="Repetitions" value={completedReps} />

                    <SummaryStat label="Target" value={targetReps} />

                    <SummaryStat
                        label="Duration"
                        value={formatDuration(duration)}
                    />

                    <SummaryStat
                        label="Status"
                        value={formatStatus(session?.status)}
                    />
                </div>

                {/* ================================================= */}
                {/* Repetition Scores */}
                {/* ================================================= */}

                {repScores.length > 0 && (
                    <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-base font-semibold text-slate-900">
                                Repetition Scores
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Individual movement scores recorded during the
                                session.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {repScores.map((score, index) => {
                                const repScore = Math.round(score);

                                return (
                                    <div
                                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                                        key={index}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-400">
                                                Rep {index + 1}
                                            </span>

                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    repScore >= 85
                                                        ? "bg-emerald-500"
                                                        : repScore >= 70
                                                          ? "bg-blue-500"
                                                          : repScore >= 50
                                                            ? "bg-amber-500"
                                                            : "bg-red-500"
                                                }`}
                                            />
                                        </div>

                                        <p
                                            className={`mt-2 text-2xl font-semibold ${
                                                repScore >= 70
                                                    ? "text-slate-900"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {repScore}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-400">
                                            / 100
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ================================================= */}
                {/* Feedback */}
                {/* ================================================= */}

                <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 3 5 6v5c0 4.5 2.8 7.5 7 10 4.2-2.5 7-5.5 7-10V6l-7-3Z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m9 12 2 2 4-4"
                                />
                            </svg>
                        </div>

                        <div>
                            {averageScore >= 85 ? (
                                <>
                                    <h2 className="text-sm font-semibold text-blue-900">
                                        Excellent work.
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-blue-800/80">
                                        Your movement quality was very good.
                                    </p>
                                </>
                            ) : averageScore >= 70 ? (
                                <>
                                    <h2 className="text-sm font-semibold text-blue-900">
                                        Good session.
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-blue-800/80">
                                        Keep working on consistency and form.
                                    </p>
                                </>
                            ) : averageScore >= 50 ? (
                                <>
                                    <h2 className="text-sm font-semibold text-blue-900">
                                        Session completed.
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-blue-800/80">
                                        Focus on controlled movement and proper
                                        form.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-sm font-semibold text-blue-900">
                                        Keep practicing.
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-blue-800/80">
                                        Try to follow the prescribed movement
                                        more closely next time.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ================================================= */}
                {/* Back */}
                {/* ================================================= */}

                <div className="mt-7 flex justify-center">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================= */
/* Summary Stat */
/* ============================================================= */

function SummaryStat({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-2 truncate text-lg font-semibold text-slate-900">
                {value}
            </p>
        </div>
    );
}

/* ============================================================= */
/* Helpers */
/* ============================================================= */

function formatDuration(seconds) {
    const totalSeconds = Number(seconds) || 0;

    const minutes = Math.floor(totalSeconds / 60);

    const remaining = totalSeconds % 60;

    if (minutes === 0) {
        return `${remaining}s`;
    }

    return `${minutes}m ${remaining}s`;
}

function formatStatus(status) {
    if (!status) {
        return "Completed";
    }

    return String(status)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default SessionSummary;
