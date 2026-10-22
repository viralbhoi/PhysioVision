import { useEffect, useState } from "react";
import { getMyAssignments, getMyPhysiotherapist } from "../services/api";

import ExerciseSession from "./ExerciseSession";
import ConnectPhysio from "../components/ConnectPhysio";

const PatientDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [physiotherapist, setPhysiotherapist] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // Load Dashboard
    // =====================================================

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
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
            console.error(err);

            setError(err.message || "Unable to load your dashboard.");
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // Exercise Session
    // =====================================================

    if (selectedAssignment) {
        return (
            <ExerciseSession
                assignment={selectedAssignment}
                onBack={() => setSelectedAssignment(null)}
            />
        );
    }

    // =====================================================
    // Loading
    // =====================================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // Error
    // =====================================================

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
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
                        className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // =====================================================
    // Patient Connected
    // =====================================================

    const handleConnected = async () => {
        await loadDashboard();
    };

    // =====================================================
    // Dashboard
    // =====================================================

    const activeAssignments = assignments.filter(
        (assignment) =>
            assignment.status === "ASSIGNED" ||
            assignment.status === "IN_PROGRESS",
    );

    const completedAssignments = assignments.filter(
        (assignment) => assignment.status === "COMPLETED",
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* =================================================
                Top Navigation
            ================================================= */}

            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                            P
                        </div>

                        <div>
                            <p className="text-sm font-semibold tracking-tight text-slate-900">
                                PhysioVision
                            </p>

                            <p className="hidden text-[11px] text-slate-400 sm:block">
                                Patient Portal
                            </p>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block"
                        >
                            Refresh
                        </button>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            P
                        </div>
                    </div>
                </div>
            </header>

            {/* =================================================
                Main
            ================================================= */}

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
                {/* =================================================
                    Welcome
                ================================================= */}

                <section className="mb-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                                Patient Portal
                            </p>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                                My Dashboard
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                                Stay on top of your rehabilitation and complete
                                your prescribed exercises.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:hidden"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </section>

                {/* =================================================
                    Overview Stats
                ================================================= */}

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Assigned */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Assigned Exercises
                                </p>

                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                    {assignments.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-5 w-5"
                                >
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                </svg>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                            {activeAssignments.length} requiring attention
                        </p>
                    </div>

                    {/* Active */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Active
                                </p>

                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                    {activeAssignments.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                            Exercises ready to perform
                        </p>
                    </div>

                    {/* Completed */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Completed
                                </p>

                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                    {completedAssignments.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-5 w-5"
                                >
                                    <path d="M5 12l4 4L19 6" />
                                </svg>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                            Keep up the consistency
                        </p>
                    </div>
                </section>

                {/* =================================================
                    Physiotherapist
                ================================================= */}

                <section className="mb-10">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Your Physiotherapist
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Your rehabilitation plan is managed by your
                            physiotherapist.
                        </p>
                    </div>

                    {physiotherapist ? (
                        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-blue-700">
                                    {getInitial(physiotherapist?.user?.name)}
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">
                                            {physiotherapist?.user?.name ||
                                                "Physiotherapist"}
                                        </h3>

                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Connected
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
                                <p className="text-xs font-medium text-slate-400">
                                    Care provider
                                </p>

                                <p className="mt-0.5 text-sm font-medium text-slate-700">
                                    Rehabilitation plan active
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ConnectPhysio onConnected={handleConnected} />
                    )}
                </section>

                {/* =================================================
                    Exercises
                ================================================= */}

                <section>
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                                Rehabilitation
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                                My Exercises
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Exercises prescribed by your physiotherapist.
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {assignments.length}{" "}
                            {assignments.length === 1
                                ? "exercise"
                                : "exercises"}
                        </span>
                    </div>

                    {/* Empty */}
                    {assignments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    className="h-6 w-6"
                                >
                                    <path d="M12 6v12M6 12h12" />
                                </svg>
                            </div>

                            <h3 className="mt-5 text-base font-semibold text-slate-900">
                                No exercises assigned yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Your prescribed exercises will appear here once
                                your physiotherapist assigns them.
                            </p>

                            {!physiotherapist && (
                                <p className="mt-3 text-xs font-medium text-amber-600">
                                    Connect with a physiotherapist to get
                                    started.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {assignments.map((assignment) => {
                                const exercise = assignment.exercise;

                                return (
                                    <div
                                        key={assignment._id}
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                                    >
                                        <div className="p-5 sm:p-6">
                                            {/* Card top */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                                                        {getInitial(
                                                            exercise?.name,
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">
                                                            {exercise?.name ||
                                                                "Exercise"}
                                                        </h3>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            Rehabilitation
                                                            exercise
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={getStatusClass(
                                                        assignment.status,
                                                    )}
                                                >
                                                    {formatStatus(
                                                        assignment.status,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-500">
                                                {exercise?.description ||
                                                    "Follow the prescribed movement and complete your target repetitions."}
                                            </p>

                                            {/* Metrics */}
                                            <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                                <div className="border-r border-slate-200 px-4 py-3">
                                                    <p className="text-xs text-slate-400">
                                                        Sets
                                                    </p>

                                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                                        {assignment.sets}
                                                    </p>
                                                </div>

                                                <div className="px-4 py-3">
                                                    <p className="text-xs text-slate-400">
                                                        Target reps
                                                    </p>

                                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                                        {assignment.targetReps}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {assignment.notes && (
                                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                                                        Physiotherapist note
                                                    </p>

                                                    <p className="mt-1 text-sm leading-5 text-slate-600">
                                                        {assignment.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedAssignment(
                                                        assignment,
                                                    )
                                                }
                                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                                Start Exercise
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                                >
                                                    <path d="M5 12h14" />
                                                    <path d="M13 6l6 6-6 6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

// =============================================================
// Helpers
// =============================================================

const getInitial = (name) => {
    if (!name) {
        return "?";
    }

    return name.trim().charAt(0).toUpperCase();
};

const formatStatus = (status) => {
    switch (status) {
        case "IN_PROGRESS":
            return "In progress";

        case "COMPLETED":
            return "Completed";

        case "PAUSED":
            return "Paused";

        case "ASSIGNED":
        default:
            return "Assigned";
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case "IN_PROGRESS":
            return "inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700";

        case "COMPLETED":
            return "inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700";

        case "PAUSED":
            return "inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700";

        case "ASSIGNED":
        default:
            return "inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600";
    }
};

export default PatientDashboard;
