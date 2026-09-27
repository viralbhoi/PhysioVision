import { useEffect, useState } from "react";
import {
    getPhysioPatients,
    getExercises,
    assignExercise,
} from "../services/api";

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

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [patientsData, exercisesData] = await Promise.all([
                getPhysioPatients(),
                getExercises(),
            ]);

            setPatients(patientsData.patients || []);

            setExercises(exercisesData.exercises || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedPatient || !selectedExercise) {
            return;
        }

        try {
            setAssigning(true);

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
            setError(err.message);
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return <div className="dashboard">Loading dashboard...</div>;
    }

    return (
        <div className="physio-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Physiotherapist Dashboard</h1>

                    <p>Manage patients and prescribe exercises.</p>
                </div>

                <button onClick={loadDashboard}>Refresh</button>
            </header>

            {error && <div className="error-message">{error}</div>}

            {/* =========================================
                Patients
            ========================================= */}

            <section>
                <h2>Patients</h2>

                {patients.length === 0 ? (
                    <p>No patients found.</p>
                ) : (
                    <div className="patient-grid">
                        {patients.map((patient) => {
                            const user = patient.user;

                            return (
                                <div
                                    className={
                                        selectedPatient?._id === patient._id
                                            ? "patient-card selected"
                                            : "patient-card"
                                    }
                                    key={patient._id}
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <h3>{user?.name || "Patient"}</h3>

                                    <p>{user?.email}</p>

                                    {selectedPatient?._id === patient._id && (
                                        <strong>Selected</strong>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* =========================================
                Exercises
            ========================================= */}

            <section>
                <h2>Exercises</h2>

                {exercises.length === 0 ? (
                    <p>No exercises available.</p>
                ) : (
                    <div className="exercise-grid">
                        {exercises.map((exercise) => (
                            <div
                                className={
                                    selectedExercise?._id === exercise._id
                                        ? "exercise-card selected"
                                        : "exercise-card"
                                }
                                key={exercise._id}
                                onClick={() => setSelectedExercise(exercise)}
                            >
                                <h3>{exercise.name}</h3>

                                <p>
                                    {exercise.description || "No description."}
                                </p>

                                {selectedExercise?._id === exercise._id && (
                                    <strong>Selected</strong>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* =========================================
                Assignment Form
            ========================================= */}

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
                        onChange={(e) => setSets(e.target.value)}
                    />
                </label>

                <label>
                    Target Repetitions
                    <input
                        type="number"
                        min="1"
                        value={targetReps}
                        onChange={(e) => setTargetReps(e.target.value)}
                    />
                </label>

                <label>
                    Notes
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instructions for the patient..."
                    />
                </label>

                <button
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
