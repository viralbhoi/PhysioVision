import { useCallback, useEffect, useState } from "react";

import {
    getMyAssignments,
    getMyPhysiotherapist,
    getMySessions,
} from "../services/api";

import ExerciseSession from "./ExerciseSession";
import SessionDetailReport from "../components/SessionDetailReport";
import ConnectPhysio from "../components/ConnectPhysio";

const PatientDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [physiotherapist, setPhysiotherapist] = useState(null);
    const [sessions, setSessions] = useState([]);

    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [historyError, setHistoryError] = useState("");
    const [historyLoading, setHistoryLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            setHistoryError("");

            const response = await getMySessions();
            setSessions(response.sessions || []);
        } catch (err) {
            console.error("Unable to load session history:", err);
            setHistoryError(err.message || "Unable to load session history.");
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [assignmentsData, physiotherapistData] = await Promise.all([
                getMyAssignments(),
                getMyPhysiotherapist(),
            ]);

            setAssignments(assignmentsData.assignments || []);
            setPhysiotherapist(physiotherapistData.physiotherapist || null);
        } catch (err) {
            console.error("Unable to load patient dashboard:", err);
            setError(err.message || "Unable to load your dashboard.");
        } finally {
            setLoading(false);
        }

        // History is independent: a history API failure must not
        // prevent the main dashboard from loading.
        await loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Keep the exercise list focused on work the patient can still do.
    // Completed work is available in Session History below.
    const activeAssignments = assignments.filter(
        (assignment) =>
            assignment.status === "ASSIGNED" ||
            assignment.status === "IN_PROGRESS",
    );

    const handleConnected = async () => {
        await loadDashboard();
    };

    const handleSessionBack = async () => {
        setSelectedSession(null);
        await loadHistory();
    };

    // Existing exercise tracking flow remains unchanged.
    if (selectedAssignment) {
        return (
            <ExerciseSession
                assignment={selectedAssignment}
                onBack={() => {
                    setSelectedAssignment(null);
                    loadDashboard();
                }}
            />
        );
    }

    if (selectedSession) {
        return (
            <SessionDetailReport
                session={selectedSession}
                onBack={handleSessionBack}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
                        !
                    </div>

                    <h2 className="mt-5 text-lg font-semibold text-slate-900">
                        Unable to load dashboard
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Navigation */}
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <div className="flex items-center gap-3">
                        <img
                            src="/pvv3.png"
                            alt="PhysioVision logo"
                            className="h-10 w-10 rounded-xl object-contain"
                        />

                        <div>
                            <p className="text-sm font-semibold tracking-tight text-slate-900">
                                PhysioVision
                            </p>

                            <p className="hidden text-[11px] text-slate-400 sm:block">
                                Physiotherapist Portal
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            ↻ Refresh
                        </button>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                            P
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
                {/* Welcome */}
                <section className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                        Patient Portal
                    </p>

                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                My Dashboard
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                                Manage your prescribed exercises, review
                                previous sessions, and track your progress.
                            </p>
                        </div>

                        <p className="text-sm text-slate-500">
                            {new Date().toLocaleDateString(undefined, {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </section>

                {/* Quick overview */}
                <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Active Exercises
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-tight">
                            {activeAssignments.length}
                        </p>
                        <p className="mt-4 text-xs text-slate-400">
                            Assigned or in progress
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Past Sessions
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-tight">
                            {sessions.length}
                        </p>
                        <p className="mt-4 text-xs text-slate-400">
                            Available in Session History
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Care Team
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-tight">
                            {physiotherapist ? "Connected" : "Not connected"}
                        </p>
                        <p className="mt-4 text-xs text-slate-400">
                            Your physiotherapist connection
                        </p>
                    </div>
                </section>

                {/* Physiotherapist */}
                <section className="mb-10">
                    <SectionHeading
                        eyebrow="Your care team"
                        title="Your Physiotherapist"
                        description="Your rehabilitation plan is managed by your physiotherapist."
                    />

                    {physiotherapist ? (
                        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">
                                    {getInitial(physiotherapist?.user?.name)}
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold">
                                            {physiotherapist?.user?.name ||
                                                "Physiotherapist"}
                                        </h3>

                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            ● Connected
                                        </span>
                                    </div>

                                    {physiotherapist?.user?.email && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            {physiotherapist.user.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-400">
                                    Care status
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    Rehabilitation plan active
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ConnectPhysio onConnected={handleConnected} />
                    )}
                </section>

                {/* Exercises */}
                <section className="mb-10">
                    <div className="mb-5">
                        <SectionHeading
                            eyebrow="Rehabilitation"
                            title="Active Exercises"
                            description="Only assigned and in-progress exercises appear here. Completed activity is available in Session History."
                        />
                    </div>

                    {activeAssignments.length === 0 ? (
                        <EmptyState
                            title="No active exercises"
                            description="You currently have no assigned or in-progress exercises. Your previous activity remains available in Session History."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {activeAssignments.map((assignment) => {
                                const exercise = assignment.exercise;

                                return (
                                    <article
                                        key={assignment._id}
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                    >
                                        <div className="p-5 sm:p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
                                                        {getInitial(
                                                            exercise?.name,
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-semibold">
                                                            {exercise?.name ||
                                                                "Exercise"}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            Rehabilitation
                                                            exercise
                                                        </p>
                                                    </div>
                                                </div>

                                                <StatusBadge
                                                    status={assignment.status}
                                                />
                                            </div>

                                            <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-500">
                                                {exercise?.description ||
                                                    "Follow the prescribed movement and complete your target repetitions."}
                                            </p>

                                            <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                                <Metric
                                                    label="Sets"
                                                    value={assignment.sets ?? 1}
                                                />
                                                <Metric
                                                    label="Target reps"
                                                    value={
                                                        assignment.targetReps ??
                                                        "—"
                                                    }
                                                    border={false}
                                                />
                                            </div>

                                            {assignment.notes && (
                                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                                        Physiotherapist note
                                                    </p>
                                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                                        {assignment.notes}
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedAssignment(
                                                        assignment,
                                                    )
                                                }
                                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                                {assignment.status ===
                                                "IN_PROGRESS"
                                                    ? "Continue Exercise"
                                                    : "Start Exercise"}
                                                <span aria-hidden="true">
                                                    →
                                                </span>
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Session history */}
                <section
                    id="session-history"
                    className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:p-6">
                        <SectionHeading
                            eyebrow="Your activity"
                            title="Session History"
                            description="Select any session to open its detailed report."
                        />

                        <button
                            type="button"
                            onClick={loadHistory}
                            disabled={historyLoading}
                            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            {historyLoading ? "Loading..." : "↻ Refresh"}
                        </button>
                    </div>

                    {historyError && (
                        <div className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <p>{historyError}</p>
                            <button
                                type="button"
                                onClick={loadHistory}
                                className="mt-2 font-semibold underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {historyLoading && sessions.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            Loading session history...
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="p-6 sm:p-8">
                            <EmptyState
                                title="No sessions recorded yet"
                                description="After you complete an exercise, your session and performance report will appear here."
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sessions.map((session) => (
                                <button
                                    type="button"
                                    key={session._id}
                                    onClick={() => setSelectedSession(session)}
                                    className="flex w-full flex-col justify-between gap-4 p-5 text-left transition hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:flex-row sm:items-center sm:px-6"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                            <HistoryIcon />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-900">
                                                {session.exercise?.name ||
                                                    "Exercise session"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {formatDateTime(
                                                    session.completedAt ||
                                                        session.createdAt,
                                                )}
                                            </p>
                                            <p className="mt-2 text-sm text-slate-600">
                                                {session.completedReps ?? 0}{" "}
                                                reps
                                                {" · "}
                                                {formatDuration(
                                                    session.duration,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                                        <div className="text-left sm:text-right">
                                            <p className="text-xl font-bold text-slate-900">
                                                {Math.round(
                                                    Number(
                                                        session.averageScore,
                                                    ) || 0,
                                                )}
                                                <span className="ml-0.5 text-sm font-medium text-slate-400">
                                                    /100
                                                </span>
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Overall score
                                            </p>
                                        </div>

                                        <span className="text-lg text-blue-600">
                                            →
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
                        <p className="text-xs text-slate-500">
                            {sessions.length}{" "}
                            {sessions.length === 1
                                ? "session recorded"
                                : "sessions recorded"}
                        </p>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-slate-400 sm:px-8">
                    PhysioVision · Rehabilitation Progress
                </div>
            </footer>
        </div>
    );
};

function SectionHeading({ eyebrow, title, description }) {
    return (
        <div>
            {eyebrow && (
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    {eyebrow}
                </p>
            )}
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {title}
            </h2>
            {description && (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                </p>
            )}
        </div>
    );
}

function Metric({ label, value, border = true }) {
    return (
        <div
            className={`px-4 py-3 ${border ? "border-r border-slate-200" : ""}`}
        >
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        ASSIGNED: "bg-slate-100 text-slate-600",
        IN_PROGRESS: "bg-blue-50 text-blue-700",
        COMPLETED: "bg-emerald-50 text-emerald-700",
        PAUSED: "bg-amber-50 text-amber-700",
    };

    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                styles[status] || styles.ASSIGNED
            }`}
        >
            {formatStatus(status)}
        </span>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <HistoryIcon />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>
    );
}

function ListIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path d="M9 6h11M9 12h11M9 18h11" />
            <path d="M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
        </svg>
    );
}

function ActivityIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h4l3-8 4 16 3-8h4"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
            />
        </svg>
    );
}

function HistoryIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12a9 9 0 1 0 3-6.7L3 8"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v5h5m4-1v5l3 2"
            />
        </svg>
    );
}

function getInitial(name) {
    return String(name || "?")
        .trim()
        .charAt(0)
        .toUpperCase();
}

function formatStatus(status) {
    const labels = {
        ASSIGNED: "Assigned",
        IN_PROGRESS: "In progress",
        COMPLETED: "Completed",
        PAUSED: "Paused",
    };

    return labels[status] || "Assigned";
}

function formatDuration(value) {
    const seconds = Math.max(0, Number(value) || 0);
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function formatDateTime(value) {
    if (!value) return "Date not recorded";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date not recorded";
    }

    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default PatientDashboard;
