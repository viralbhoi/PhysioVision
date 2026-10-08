import { useEffect, useState } from "react";

import {
    getPhysioPatients,
    getExercises,
    assignExercise,
} from "../services/api";

import ReferenceVideoCalibrator from "./ReferenceVideoCalibrator";
import PatientProgress from "./PatientProgress";

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
            setError(err.message || "Unable to load dashboard.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // Assign Exercise
    // =========================================================

    const handleAssign = async () => {
        if (!selectedPatient || !selectedExercise) {
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

            alert("Exercise assigned successfully.");

            setSelectedPatient(null);
            setSelectedExercise(null);
            setSets(1);
            setTargetReps(10);
            setNotes("");
        } catch (err) {
            setError(err.message || "Unable to assign exercise.");
        } finally {
            setAssigning(false);
        }
    };

    // =========================================================
    // View Patient Progress
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
        return <div className="dashboard">Loading dashboard...</div>;
    }

    // =========================================================
    // Reference Video Calibration
    // =========================================================

    if (calibratingExercise) {
        return (
            <ReferenceVideoCalibrator
                onCreated={(exercise) => {
                    setExercises((previous) => [exercise, ...previous]);

                    setCalibratingExercise(false);
                }}
                onCancel={() => setCalibratingExercise(false)}
            />
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

    return (
        <div className="physio-dashboard">
            {/* ================================================= */}
            {/* Header */}
            {/* ================================================= */}

            <header className="dashboard-header">
                <div>
                    <h1>Physiotherapist Dashboard</h1>

                    <p>Manage patients and prescribe exercises.</p>
                </div>

                <div>
                    <button type="button" onClick={loadDashboard}>
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setCalibratingExercise(true)}
                    >
                        Create Exercise
                    </button>
                </div>
            </header>

            {/* ================================================= */}
            {/* Error */}
            {/* ================================================= */}

            {error && <div className="error-message">{error}</div>}

            {/* ================================================= */}
            {/* Patients */}
            {/* ================================================= */}

            <section>
                <h2>Patients</h2>

                {patients.length === 0 ? (
                    <p>No patients found.</p>
                ) : (
                    <div className="patient-grid">
                        {patients.map((patient) => {
                            const user = patient.user;

                            const isSelected =
                                selectedPatient?._id === patient._id;

                            return (
                                <div
                                    className={
                                        isSelected
                                            ? "patient-card selected"
                                            : "patient-card"
                                    }
                                    key={patient._id}
                                >
                                    <div
                                        className="patient-info"
                                        onClick={() =>
                                            setSelectedPatient(patient)
                                        }
                                    >
                                        <h3>{user?.name || "Patient"}</h3>

                                        <p>{user?.email}</p>

                                        {isSelected && (
                                            <strong>Selected</strong>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleViewProgress(patient)
                                        }
                                    >
                                        View Progress
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ================================================= */}
            {/* Exercises */}
            {/* ================================================= */}

            <section>
                <h2>Exercises</h2>

                {exercises.length === 0 ? (
                    <p>No exercises available.</p>
                ) : (
                    <div className="exercise-grid">
                        {exercises.map((exercise) => {
                            const isSelected =
                                selectedExercise?._id === exercise._id;

                            return (
                                <div
                                    className={
                                        isSelected
                                            ? "exercise-card selected"
                                            : "exercise-card"
                                    }
                                    key={exercise._id}
                                    onClick={() =>
                                        setSelectedExercise(exercise)
                                    }
                                >
                                    <h3>{exercise.name}</h3>

                                    <p>
                                        {exercise.description ||
                                            "No description."}
                                    </p>

                                    {isSelected && <strong>Selected</strong>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ================================================= */}
            {/* Assignment Form */}
            {/* ================================================= */}

            <section className="assignment-form">
                <h2>Assign Exercise</h2>

                <div>
                    <strong>Patient:</strong>

                    <span>
                        {" "}
                        {selectedPatient?.user?.name || "None selected"}
                    </span>
                </div>

                <div>
                    <strong>Exercise:</strong>

                    <span> {selectedExercise?.name || "None selected"}</span>
                </div>

                <label>
                    Sets
                    <input
                        type="number"
                        min="1"
                        value={sets}
                        onChange={(event) => setSets(event.target.value)}
                    />
                </label>

                <label>
                    Target Repetitions
                    <input
                        type="number"
                        min="1"
                        value={targetReps}
                        onChange={(event) => setTargetReps(event.target.value)}
                    />
                </label>

                <label>
                    Notes
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Instructions for the patient..."
                    />
                </label>

                <button
                    type="button"
                    onClick={handleAssign}
                    disabled={
                        assigning || !selectedPatient || !selectedExercise
                    }
                >
                    {assigning ? "Assigning..." : "Assign Exercise"}
                </button>
            </section>
        </div>
    );
};

export default PhysioDashboard;
