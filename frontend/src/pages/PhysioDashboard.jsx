import { useEffect, useState } from "react";

import {
    getPhysioPatients,
    getExercises,
    assignExercise,
} from "../services/api";

import ReferenceVideoCalibrator from "./ReferenceVideoCalibrator";
import PatientProgress from "./PatientProgress";
import AddPatient from "../components/AddPatient";
import YogaExerciseCreator from "../components/YogaExerciseCreator";

const PhysioDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [exercises, setExercises] = useState([]);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);

    const [sets, setSets] = useState(1);
    const [targetReps, setTargetReps] = useState(10);
    const [notes, setNotes] = useState("");

    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState("");

    const [calibratingExercise, setCalibratingExercise] = useState(false);

    const [viewingProgress, setViewingProgress] = useState(false);
    const [showAddPatient, setShowAddPatient] = useState(false);

    const [showYogaCreator, setShowYogaCreator] = useState(false);
    const [patientSearch, setPatientSearch] = useState("");
    const [patientFilter, setPatientFilter] = useState("all");
    const [exerciseSearch, setExerciseSearch] = useState("");
    const [exerciseFilter, setExerciseFilter] = useState("all");

    const filteredPatients = patients.filter((patient) => {
        const name = patient.user?.name || "";
        const email = patient.user?.email || "";
        const query = patientSearch.trim().toLowerCase();
        const matchesSearch =
            !query || `${name} ${email}`.toLowerCase().includes(query);
        const matchesFilter =
            patientFilter === "all" ||
            (patientFilter === "selected" &&
                selectedPatient?._id === patient._id) ||
            (patientFilter === "unselected" &&
                selectedPatient?._id !== patient._id);
        return matchesSearch && matchesFilter;
    });

    const filteredExercises = exercises.filter((exercise) => {
        const query = exerciseSearch.trim().toLowerCase();
        const matchesSearch =
            !query ||
            `${exercise.name || ""} ${exercise.description || ""}`
                .toLowerCase()
                .includes(query);
        const matchesFilter =
            exerciseFilter === "all" ||
            (exerciseFilter === "custom" && exercise.isCustom) ||
            (exerciseFilter === "standard" && !exercise.isCustom);
        return matchesSearch && matchesFilter;
    });

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("jwt");
        window.location.href = "/login";
    };

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    // =========================================================
    // Load Dashboard
    // =========================================================

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [patientsData, exercisesData] = await Promise.all([
                getPhysioPatients(),
                getExercises(),
            ]);

            setPatients(patientsData.patients || []);
            setExercises(exercisesData.exercises || []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to load dashboard.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // Patient Connection
    // =========================================================

    const handlePatientAdded = async () => {
        setShowAddPatient(false);

        try {
            const patientsData = await getPhysioPatients();

            setPatients(patientsData.patients || []);
        } catch (err) {
            console.error(err);

            setError(err.message || "Unable to refresh patients.");
        }
    };

    // =========================================================
    // Assign Exercise
    // =========================================================

    const handleAssign = async () => {
        if (!selectedPatient || !selectedExercise) {
            setError("Please select both a patient and an exercise.");
            return;
        }

        try {
            setAssigning(true);
            setError("");

            await assignExercise({
                patientId: selectedPatient._id,
                exerciseId: selectedExercise._id,
                sets: Number(sets),
                targetReps: Number(targetReps),
                notes,
            });

            setSelectedPatient(null);
            setSelectedExercise(null);
            setSets(1);
            setTargetReps(10);
            setNotes("");

            alert("Exercise assigned successfully.");
        } catch (err) {
            console.error(err);

            setError(err.message || "Unable to assign exercise.");
        } finally {
            setAssigning(false);
        }
    };

    // =========================================================
    // Patient Progress
    // =========================================================

    const handleViewProgress = (patient) => {
        setSelectedPatient(patient);
        setViewingProgress(true);
    };

    const handleBackFromProgress = () => {
        setViewingProgress(false);
        setSelectedPatient(null);
    };

    // =========================================================
    // Loading
    // =========================================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // Patient Progress
    // =========================================================

    if (viewingProgress && selectedPatient) {
        return (
            <PatientProgress
                patient={selectedPatient}
                onBack={handleBackFromProgress}
            />
        );
    }

    // =========================================================
    // Dashboard
    // =========================================================

    const selectedPatientName = selectedPatient?.user?.name || null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* =================================================
                Top Navigation
            ================================================= */}

            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
                    {/* Brand */}
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

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block"
                        >
                            ↻ Refresh
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                            Log out
                        </button>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
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
                    Page Header
                ================================================= */}

                <section className="mb-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                                Physiotherapist Portal
                            </p>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                                Dashboard
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                                Manage your patients, prescribe exercises and
                                monitor rehabilitation progress.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAddPatient(true)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                + Add Patient
                            </button>

                            <button
                                type="button"
                                onClick={() => setCalibratingExercise(true)}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                                + Create Exercise
                            </button>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    Error
                ================================================= */}

                {error && (
                    <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                        <div className="flex items-start gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                                !
                            </span>

                            <span>{error}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-lg leading-none text-red-400 hover:text-red-600"
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* =================================================
                    Overview
                ================================================= */}

                <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Patients */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => scrollToSection("patients-section")}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                scrollToSection("patients-section");
                            }
                        }}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Total Patients
                                </p>

                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                    {patients.length}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                    Connected to your account
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
                                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 00-3-3.87" />
                                    <path d="M16 3.13a4 4 0 010 7.75" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Exercises */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => scrollToSection("exercises-section")}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                scrollToSection("exercises-section");
                            }
                        }}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-violet-100"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Exercise Library
                                </p>

                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                    {exercises.length}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                    Available prescriptions
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-5 w-5"
                                >
                                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Workspace */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => scrollToSection("patients-section")}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                scrollToSection("patients-section");
                            }
                        }}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Workspace
                                </p>

                                <p className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    Active
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                    All systems operational
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
                    </div>
                </section>

                {/* =================================================
                    Patients
                ================================================= */}

                <section id="patients-section" className="mb-10">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                                Care Management
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                                Patients
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Patients currently connected to you.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAddPatient(true)}
                            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            + Add Patient
                        </button>
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                        <input
                            type="search"
                            value={patientSearch}
                            onChange={(event) =>
                                setPatientSearch(event.target.value)
                            }
                            placeholder="Search patients by name or email..."
                            aria-label="Search patients by name or email"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                        <select
                            value={patientFilter}
                            onChange={(event) =>
                                setPatientFilter(event.target.value)
                            }
                            aria-label="Filter patients"
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        >
                            <option value="all">All patients</option>
                            <option value="selected">Selected patient</option>
                            <option value="unselected">Not selected</option>
                        </select>
                    </div>

                    {patients.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    className="h-6 w-6"
                                >
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>

                            <h3 className="mt-5 text-base font-semibold text-slate-900">
                                No patients connected
                            </h3>

                            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                                Generate a secure connection code and share it
                                with your patient. They can enter the code from
                                their dashboard to connect with you.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowAddPatient(true)}
                                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                                Generate Connection Code
                            </button>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                            No patients match your search or filter.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredPatients.map((patient) => {
                                const user = patient.user;

                                const isSelected =
                                    selectedPatient?._id === patient._id;

                                const patientName = user?.name || "Patient";

                                const initial = patientName
                                    .charAt(0)
                                    .toUpperCase();

                                return (
                                    <div
                                        key={patient._id}
                                        className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                                            isSelected
                                                ? "border-blue-500 ring-4 ring-blue-50"
                                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                                                    {initial}
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="truncate font-semibold text-slate-900">
                                                        {patientName}
                                                    </h3>

                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {user?.email ||
                                                            "No email available"}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                                Connected
                                            </span>
                                        </div>

                                        <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedPatient(patient)
                                                }
                                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                    isSelected
                                                        ? "bg-blue-600 text-white"
                                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                }`}
                                            >
                                                {isSelected
                                                    ? "Selected"
                                                    : "Select Patient"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleViewProgress(patient)
                                                }
                                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                View Progress
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* =================================================
                    Exercise Library
                ================================================= */}

                <section id="exercises-section" className="mb-10">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                                Exercise Management
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                                Exercise Library
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select an exercise to prescribe to your selected
                                patient.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setCalibratingExercise(true)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                + Create Exercise
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowYogaCreator(true)}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                {showYogaCreator
                                    ? "− Hide Yoga Creator"
                                    : "+ Create Yoga Exercise"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href =
                                        "/physio/generalized-sessions";
                                }}
                                className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100"
                            >
                                + Generalized Sessions
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                        <input
                            type="search"
                            value={exerciseSearch}
                            onChange={(event) =>
                                setExerciseSearch(event.target.value)
                            }
                            placeholder="Search exercises by name or description..."
                            aria-label="Search exercises by name or description"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                        <select
                            value={exerciseFilter}
                            onChange={(event) =>
                                setExerciseFilter(event.target.value)
                            }
                            aria-label="Filter exercises"
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        >
                            <option value="all">All exercises</option>
                            <option value="custom">Custom exercises</option>
                        </select>
                    </div>

                    {exercises.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    className="h-6 w-6"
                                >
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>

                            <h3 className="mt-5 text-base font-semibold text-slate-900">
                                No exercises available
                            </h3>

                            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                                Create an exercise using a reference video.
                                PhysioVision will generate the movement
                                configuration automatically.
                            </p>

                            <button
                                type="button"
                                onClick={() => setCalibratingExercise(true)}
                                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                                Create Exercise
                            </button>
                        </div>
                    ) : filteredExercises.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                            No exercises match your search or filter.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredExercises.map((exercise) => {
                                const isSelected =
                                    selectedExercise?._id === exercise._id;

                                const joints =
                                    exercise.configuration?.primaryJoints
                                        ?.length || 0;

                                return (
                                    <button
                                        type="button"
                                        key={exercise._id}
                                        onClick={() =>
                                            setSelectedExercise(exercise)
                                        }
                                        className={`group text-left rounded-2xl border bg-white p-5 shadow-sm transition ${
                                            isSelected
                                                ? "border-blue-500 ring-4 ring-blue-50"
                                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600">
                                                E
                                            </div>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                    exercise.isCustom
                                                        ? "bg-violet-50 text-violet-700"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {exercise.isCustom
                                                    ? "Custom"
                                                    : "Exercise"}
                                            </span>
                                        </div>

                                        <h3 className="mt-5 font-semibold text-slate-900">
                                            {exercise.name}
                                        </h3>

                                        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">
                                            {exercise.description ||
                                                "No description available."}
                                        </p>

                                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                            <span className="text-xs text-slate-400">
                                                {joints} tracked{" "}
                                                {joints === 1
                                                    ? "joint"
                                                    : "joints"}
                                            </span>

                                            <span className="text-xs font-medium text-slate-500">
                                                Tolerance ±
                                                {exercise.configuration
                                                    ?.tolerance || 15}
                                                °
                                            </span>
                                        </div>

                                        {isSelected && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                                                    ✓
                                                </span>
                                                Selected for prescription
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* =================================================
                    Assignment Panel
                ================================================= */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                            Prescription
                        </p>

                        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                            Assign Exercise
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Configure the prescription and send it to the
                            selected patient.
                        </p>
                    </div>

                    {/* Selected items */}
                    <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2">
                        <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r sm:px-6">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Patient
                            </p>

                            <p
                                className={`mt-1 text-sm font-semibold ${
                                    selectedPatientName
                                        ? "text-slate-900"
                                        : "text-slate-400"
                                }`}
                            >
                                {selectedPatientName ||
                                    "Select a patient above"}
                            </p>
                        </div>

                        <div className="px-5 py-4 sm:px-6">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Exercise
                            </p>

                            <p
                                className={`mt-1 text-sm font-semibold ${
                                    selectedExercise
                                        ? "text-slate-900"
                                        : "text-slate-400"
                                }`}
                            >
                                {selectedExercise?.name ||
                                    "Select an exercise above"}
                            </p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Sets
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={sets}
                                onChange={(event) =>
                                    setSets(event.target.value)
                                }
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Target repetitions
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={targetReps}
                                onChange={(event) =>
                                    setTargetReps(event.target.value)
                                }
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Patient instructions
                            </label>

                            <textarea
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                placeholder="Add instructions, precautions or notes for the patient..."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="text-sm text-slate-500">
                            {!selectedPatient || !selectedExercise ? (
                                <span>
                                    Select a patient and exercise to continue.
                                </span>
                            ) : (
                                <span>
                                    Ready to assign{" "}
                                    <strong className="font-semibold text-slate-700">
                                        {selectedExercise.name}
                                    </strong>{" "}
                                    to{" "}
                                    <strong className="font-semibold text-slate-700">
                                        {selectedPatientName}
                                    </strong>
                                    .
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={
                                assigning ||
                                !selectedPatient ||
                                !selectedExercise
                            }
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {assigning ? "Assigning..." : "Assign Exercise"}
                        </button>
                    </div>
                </section>
            </main>

            {/* Shared modal styling for both exercise creators */}
            {(calibratingExercise || showYogaCreator) && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            if (calibratingExercise)
                                setCalibratingExercise(false);
                            if (showYogaCreator) setShowYogaCreator(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label={
                            calibratingExercise
                                ? "Create exercise from reference video"
                                : "Create yoga exercise"
                        }
                        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                                    Exercise Management
                                </p>
                                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                                    {calibratingExercise
                                        ? "Create Exercise"
                                        : "Create Yoga Exercise"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setCalibratingExercise(false);
                                    setShowYogaCreator(false);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                                aria-label="Close creator"
                            >
                                ×
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                            {calibratingExercise && (
                                <ReferenceVideoCalibrator
                                    onCreated={(exercise) => {
                                        if (exercise) {
                                            setExercises((previous) => [
                                                exercise,
                                                ...previous,
                                            ]);
                                            setSelectedExercise(exercise);
                                        }
                                        setCalibratingExercise(false);
                                    }}
                                    onCancel={() =>
                                        setCalibratingExercise(false)
                                    }
                                />
                            )}
                            {showYogaCreator && (
                                <YogaExerciseCreator
                                    onCancel={() => setShowYogaCreator(false)}
                                    onCreated={(exercise) => {
                                        if (exercise) {
                                            setExercises((previous) => [
                                                exercise,
                                                ...previous.filter(
                                                    (item) =>
                                                        item._id !==
                                                        exercise._id,
                                                ),
                                            ]);
                                            setSelectedExercise(exercise);
                                        }
                                        setShowYogaCreator(false);
                                    }}
                                />
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* =================================================
                Add Patient
            ================================================= */}

            {showAddPatient && (
                <AddPatient
                    onClose={() => setShowAddPatient(false)}
                    onConnected={handlePatientAdded}
                />
            )}
        </div>
    );
};

export default PhysioDashboard;
