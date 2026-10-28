import { useEffect, useState } from "react";
import { getPatientProgress, getPatientSessions } from "../services/api";

function PatientProgress({ patient, onBack }) {
    const [progress, setProgress] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedExercise, setSelectedExercise] = useState("ALL");
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        if (patient?._id) {
            loadProgress();
        }
    }, [patient?._id]);

    const loadProgress = async () => {
        try {
            setLoading(true);
            setError("");

            const [progressResponse, sessionsResponse] = await Promise.all([
                getPatientProgress(patient._id),
                getPatientSessions(patient._id),
            ]);

            setProgress(progressResponse.progress || []);
            setSessions(sessionsResponse.sessions || []);
        } catch (err) {
            console.error("Unable to load patient progress:", err);
            setError(err.message || "Unable to load patient progress.");
        } finally {
            setLoading(false);
        }
    };

    if (selectedSession) {
        return (
            <SessionDetailReport
                session={selectedSession}
                patient={patient}
                onBack={() => setSelectedSession(null)}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-125 items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Loading patient progress...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                    <span className="text-lg">←</span>
                    Back to patients
                </button>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path
                                    strokeLinecap="round"
                                    d="M12 8v4M12 16h.01"
                                />
                            </svg>
                        </div>

                        <div>
                            <h2 className="font-semibold text-red-900">
                                Unable to load progress
                            </h2>

                            <p className="mt-1 text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const exercises = progress
        .map((item) => ({
            id: item.exercise?._id,
            name: item.exercise?.name || "Exercise",
        }))
        .filter((exercise) => exercise.id);

    const filteredSessions =
        selectedExercise === "ALL"
            ? sessions
            : sessions.filter(
                  (session) => session.exercise?._id === selectedExercise,
              );

    const totalSessions = progress.reduce(
        (total, item) => total + Number(item.totalSessions || 0),
        0,
    );

    const totalReps = progress.reduce(
        (total, item) => total + Number(item.totalReps || 0),
        0,
    );

    const averageAccuracy =
        progress.length > 0
            ? Math.round(
                  progress.reduce(
                      (total, item) =>
                          total + Number(item.averageAccuracy || 0),
                      0,
                  ) / progress.length,
              )
            : 0;

    return (
        <div className="min-h-full bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* ================================================= */}
                {/* Header */}
                {/* ================================================= */}

                <header className="mb-8">
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                        <span className="text-lg">←</span>
                        Back to patients
                    </button>

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
                                    {getInitial(
                                        patient?.user?.name ||
                                            patient?.name ||
                                            "P",
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                        Patient Progress
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {patient?.user?.name ||
                                            patient?.name ||
                                            "Patient"}
                                    </p>

                                    {patient?.user?.email && (
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {patient.user.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={loadProgress}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 md:self-auto"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20 11a8.1 8.1 0 0 0-14.8-4.5L4 8"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 4v4h4"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 13a8.1 8.1 0 0 0 14.8 4.5L20 16"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20 20v-4h-4"
                                />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </header>

                {/* ================================================= */}
                {/* Overview */}
                {/* ================================================= */}

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <OverviewCard
                        label="Total Sessions"
                        value={totalSessions}
                        description="Completed sessions"
                        icon="sessions"
                    />

                    <OverviewCard
                        label="Total Reps"
                        value={totalReps}
                        description="Across all exercises"
                        icon="reps"
                    />

                    <OverviewCard
                        label="Average Accuracy"
                        value={`${averageAccuracy}%`}
                        description="Across exercises"
                        icon="accuracy"
                    />
                </section>

                {/* ================================================= */}
                {/* Exercise Progress */}
                {/* ================================================= */}

                <section className="mb-8">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Exercise Progress
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Performance trends across assigned exercises.
                        </p>
                    </div>

                    {progress.length === 0 ? (
                        <EmptyState
                            title="No completed sessions yet"
                            description="Progress will appear here once the patient completes an exercise session."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {progress.map((item) => (
                                <ProgressCard key={item._id} progress={item} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ================================================= */}
                {/* Session History */}
                {/* ================================================= */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Session History
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Review completed exercise sessions.
                            </p>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedExercise}
                                onChange={(event) =>
                                    setSelectedExercise(event.target.value)
                                }
                                className="min-w-47.5 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            >
                                <option value="ALL">All Exercises</option>

                                {exercises.map((exercise) => (
                                    <option
                                        key={exercise.id}
                                        value={exercise.id}
                                    >
                                        {exercise.name}
                                    </option>
                                ))}
                            </select>

                            <svg
                                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m6 9 6 6 6-6"
                                />
                            </svg>
                        </div>
                    </div>

                    {filteredSessions.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                title="No sessions found"
                                description={
                                    selectedExercise === "ALL"
                                        ? "The patient has not completed any sessions yet."
                                        : "No completed sessions exist for this exercise."
                                }
                                compact
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-162.5">
                                {/* Table header */}
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-slate-100 bg-slate-50 px-6 py-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Exercise
                                    </span>

                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Reps
                                    </span>

                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Score
                                    </span>

                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Duration
                                    </span>
                                </div>

                                {filteredSessions.map((session) => (
                                    <SessionRow
                                        key={session._id}
                                        session={session}
                                        onClick={() =>
                                            setSelectedSession(session)
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

/* ============================================================= */
/* Detailed Session Report */
/* ============================================================= */

function SessionDetailReport({ session, patient, onBack }) {
    const score = Math.round(Number(session.averageScore ?? 0));
    const dateTime = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleString();
    };
    const readable = (value) => {
        if (value === null || value === undefined || value === "") return "—";
        if (typeof value === "object") return JSON.stringify(value, null, 2);
        return String(value);
    };
    const formatDuration = (value) => {
        const seconds = Math.max(0, Number(value) || 0);
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);
        return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
    };
    const fields = [
        ["Session ID", session._id],
        ["Status", session.status],
        ["Exercise", session.exercise?.name],
        ["Completed repetitions", session.completedReps],
        ["Target repetitions", session.targetReps],
        ["Average score", session.averageScore == null ? null : `${score}%`],
        [
            "Duration",
            session.duration == null ? null : formatDuration(session.duration),
        ],
        ["Started at", dateTime(session.startedAt)],
        ["Completed at", dateTime(session.completedAt)],
        ["Created at", dateTime(session.createdAt)],
        ["Last updated", dateTime(session.updatedAt)],
        [
            "Assignment ID",
            typeof session.assignment === "object"
                ? session.assignment?._id
                : session.assignment,
        ],
        [
            "Patient ID",
            typeof session.patient === "object"
                ? session.patient?._id
                : session.patient,
        ],
    ];

    return (
        <div className="min-h-full bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                    <span className="text-lg">←</span> Back to session history
                </button>

                <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                        Session report
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {session.exercise?.name || "Exercise session"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Patient:{" "}
                        {patient?.user?.name || patient?.name || "Patient"}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <ReportMetric
                            label="Repetitions"
                            value={`${session.completedReps ?? 0}${session.targetReps != null ? ` / ${session.targetReps}` : ""}`}
                        />
                        <ReportMetric
                            label="Average score"
                            value={`${score}%`}
                        />
                        <ReportMetric
                            label="Duration"
                            value={formatDuration(session.duration)}
                        />
                        <ReportMetric
                            label="Status"
                            value={session.status || "—"}
                        />
                    </div>
                </header>

                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                        Session information
                    </h2>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {fields.map(([label, value]) => (
                            <div
                                key={label}
                                className="rounded-xl bg-slate-50 p-3"
                            >
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    {label}
                                </dt>
                                <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-800">
                                    {readable(value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* Match the working patient-side repetition score cards. */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5 sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Repetition scores
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Individual scores recorded during this session.
                        </p>
                    </div>
                    {Array.isArray(session.repScores) &&
                    session.repScores.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-5 sm:p-6">
                            {session.repScores.map((value, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl bg-slate-50 p-4"
                                >
                                    <p className="text-xs text-slate-400">
                                        Rep {index + 1}
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">
                                        {Math.round(Number(value) || 0)} / 100
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="p-5 text-sm text-slate-500">
                            No individual repetition scores were recorded.
                        </p>
                    )}
                </section>

                {Array.isArray(session.repetitions) &&
                    session.repetitions.length > 0 && (
                        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 p-5 sm:p-6">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Recorded repetition details
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {session.repetitions.map((rep, index) => (
                                    <div
                                        key={rep?._id || index}
                                        className="flex flex-wrap items-center justify-between gap-3 p-4"
                                    >
                                        <span className="font-medium text-slate-800">
                                            Rep {rep?.number ?? index + 1}
                                        </span>
                                        <span className="text-sm text-slate-600">
                                            Score: {rep?.score ?? 0}
                                        </span>
                                        <span className="text-sm text-slate-600">
                                            Duration:{" "}
                                            {formatDuration(rep?.duration)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                {/* <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="mb-3 text-lg font-semibold text-slate-900">
                        Complete session record
                    </h2>
                    <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </section> */}
            </div>
        </div>
    );
}

function ReportMetric({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 wrap-break-word text-lg font-semibold text-slate-900">
                {value}
            </p>
        </div>
    );
}

/* ============================================================= */
/* Overview Card */
/* ============================================================= */

function OverviewCard({ label, value, description, icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">{description}</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {icon === "sessions" && (
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        >
                            <rect x="4" y="5" width="16" height="15" rx="2" />
                            <path
                                strokeLinecap="round"
                                d="M8 3v4M16 3v4M4 10h16"
                            />
                        </svg>
                    )}

                    {icon === "reps" && (
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
                                d="M6 12h12M8 8v8M16 8v8"
                            />
                            <path strokeLinecap="round" d="M4 10v4M20 10v4" />
                        </svg>
                    )}

                    {icon === "accuracy" && (
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
                                d="M4 19V5M4 19h16"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m7 15 4-4 3 2 5-6"
                            />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================= */
/* Progress Card */
/* ============================================================= */

function ProgressCard({ progress }) {
    const accuracy = Math.round(progress.averageAccuracy || 0);
    const lastAccuracy = Math.round(progress.lastAccuracy || 0);

    const safeAccuracy = Math.min(100, Math.max(0, accuracy));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                        {progress.exercise?.name || "Exercise"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                        {progress.totalSessions || 0}{" "}
                        {progress.totalSessions === 1 ? "session" : "sessions"}
                    </p>
                </div>

                <TrendBadge trend={progress.trend} />
            </div>

            <div className="mt-6 flex items-end justify-between">
                <div>
                    <div className="flex items-baseline gap-1">
                        <strong className="text-4xl font-semibold tracking-tight text-slate-900">
                            {accuracy}
                        </strong>

                        <span className="text-lg font-medium text-slate-400">
                            %
                        </span>
                    </div>

                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Average accuracy
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-xs font-medium text-slate-400">Latest</p>

                    <p className="mt-1 text-lg font-semibold text-slate-800">
                        {lastAccuracy}%
                    </p>
                </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                        width: `${safeAccuracy}%`,
                    }}
                />
            </div>

            <div className="mt-5 grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-4">
                <div>
                    <p className="text-xs text-slate-400">Total Reps</p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {progress.totalReps || 0}
                    </p>
                </div>

                <div className="pl-5">
                    <p className="text-xs text-slate-400">Last Session</p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {progress.lastSessionAt
                            ? formatDate(progress.lastSessionAt)
                            : "—"}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ============================================================= */
/* Trend Badge */
/* ============================================================= */

function TrendBadge({ trend }) {
    const normalizedTrend = String(trend || "STABLE").toUpperCase();

    const config = {
        IMPROVING: {
            label: "Improving",
            className: "bg-emerald-50 text-emerald-700",
            icon: "↑",
        },
        DECLINING: {
            label: "Declining",
            className: "bg-red-50 text-red-700",
            icon: "↓",
        },
        STABLE: {
            label: "Stable",
            className: "bg-slate-100 text-slate-600",
            icon: "→",
        },
    };

    const current = config[normalizedTrend] || config.STABLE;

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${current.className}`}
        >
            <span>{current.icon}</span>
            {current.label}
        </span>
    );
}

/* ============================================================= */
/* Session Row */
/* ============================================================= */

function SessionRow({ session, onClick }) {
    const score = Math.round(session.averageScore || 0);

    const date = session.completedAt ? formatDate(session.completedAt) : "—";

    const duration = formatDuration(session.duration);

    return (
        <button
            type="button"
            onClick={onClick}
            className="grid w-full grid-cols-[2fr_1fr_1fr_1fr] items-center border-b border-slate-100 px-6 py-4 text-left transition last:border-b-0 hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label={`View detailed report for ${session.exercise?.name || "exercise session"}`}
        >
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                    {session.exercise?.name || "Exercise"}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">{date}</p>
            </div>

            <div>
                <span className="text-sm font-medium text-slate-700">
                    {session.completedReps ?? 0}
                </span>
            </div>

            <div>
                <span
                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        score >= 80
                            ? "bg-emerald-50 text-emerald-700"
                            : score >= 50
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                    }`}
                >
                    {score}%
                </span>
            </div>

            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-600">
                    {duration}
                </span>
                <span className="text-xs font-semibold text-blue-600">
                    View →
                </span>
            </div>
        </button>
    );
}

/* ============================================================= */
/* Empty State */
/* ============================================================= */

function EmptyState({ title, description, compact = false }) {
    return (
        <div
            className={`rounded-2xl border border-dashed border-slate-200 bg-white text-center ${
                compact ? "py-10" : "px-6 py-14"
            }`}
        >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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
                        d="M9 5h6M9 9h6M9 13h6M9 17h3"
                    />
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                </svg>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
                {title}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">
                {description}
            </p>
        </div>
    );
}

/* ============================================================= */
/* Helpers */
/* ============================================================= */

function getInitial(name) {
    return String(name || "P")
        .trim()
        .charAt(0)
        .toUpperCase();
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatDuration(seconds) {
    const value = Number(seconds) || 0;

    const minutes = Math.floor(value / 60);
    const remaining = value % 60;

    if (minutes === 0) {
        return `${remaining}s`;
    }

    return `${minutes}m ${remaining}s`;
}

export default PatientProgress;
