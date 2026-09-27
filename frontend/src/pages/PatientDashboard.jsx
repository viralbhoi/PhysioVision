import { useEffect, useState } from "react";
import { getMyAssignments } from "../services/api";
import ExerciseSession from "./ExerciseSession";

const PatientDashboard = () => {
    const [assignments, setAssignments] = useState([]);

    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);

            const data = await getMyAssignments();

            setAssignments(data.assignments || []);
        } catch (err) {
            console.error(err);

            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // Exercise selected
    // =====================================================

    if (selectedAssignment) {
        return <ExerciseSession assignment={selectedAssignment} />;
    }

    // =====================================================
    // Loading
    // =====================================================

    if (loading) {
        return (
            <div className="dashboard">
                <h2>Loading exercises...</h2>
            </div>
        );
    }

    // =====================================================
    // Error
    // =====================================================

    if (error) {
        return (
            <div className="dashboard">
                <h2>Unable to load exercises</h2>

                <p>{error}</p>

                <button onClick={loadAssignments}>Retry</button>
            </div>
        );
    }

    // =====================================================
    // No assignments
    // =====================================================

    if (assignments.length === 0) {
        return (
            <div className="dashboard">
                <h1>Patient Dashboard</h1>

                <div className="empty-state">
                    <h2>No exercises assigned</h2>

                    <p>
                        Your physiotherapist has not assigned any exercises yet.
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // Dashboard
    // =====================================================

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>My Exercises</h1>

                    <p>Exercises assigned by your physiotherapist</p>
                </div>

                <button onClick={loadAssignments}>Refresh</button>
            </header>

            <div className="assignment-grid">
                {assignments.map((assignment) => {
                    const exercise = assignment.exercise;

                    return (
                        <div className="assignment-card" key={assignment._id}>
                            <div className="assignment-content">
                                <h2>{exercise.name}</h2>

                                <p>
                                    {exercise.description ||
                                        "No description available."}
                                </p>

                                <div className="assignment-info">
                                    <span>Sets: {assignment.sets}</span>

                                    <span>
                                        Target Reps: {assignment.targetReps}
                                    </span>

                                    <span>Status: {assignment.status}</span>
                                </div>

                                {assignment.notes && (
                                    <div className="assignment-notes">
                                        <strong>Physiotherapist Notes</strong>

                                        <p>{assignment.notes}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedAssignment(assignment)
                                }
                            >
                                Start Exercise
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PatientDashboard;
