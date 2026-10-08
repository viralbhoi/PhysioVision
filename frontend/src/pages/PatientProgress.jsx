import { useEffect, useState } from "react";

import { getPatientProgress, getPatientSessions } from "../services/api";

import "./PatientProgress.css";

function PatientProgress({ patient, onBack }) {
    const [progress, setProgress] = useState([]);

    const [sessions, setSessions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [selectedExercise, setSelectedExercise] = useState("ALL");

    useEffect(() => {
        loadProgress();
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

    if (loading) {
        return (
            <div className="patient-progress">
                <p>Loading patient progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="patient-progress">
                <button type="button" onClick={onBack}>
                    ← Back
                </button>

                <div className="progress-error">{error}</div>
            </div>
        );
    }

    const exercises = progress.map((item) => ({
        id: item.exercise?._id,
        name: item.exercise?.name || "Exercise",
    }));

    const filteredSessions =
        selectedExercise === "ALL"
            ? sessions
            : sessions.filter(
                  (session) => session.exercise?._id === selectedExercise,
              );

    return (
        <div className="patient-progress">
            {/* ================================================= */}
            {/* Header */}
            {/* ================================================= */}

            <header className="progress-header">
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="back-button"
                    >
                        ← Back
                    </button>

                    <h1>Patient Progress</h1>

                    <p>{patient.user?.name || patient.name || "Patient"}</p>

                    {patient.user?.email && <small>{patient.user.email}</small>}
                </div>
            </header>

            {/* ================================================= */}
            {/* Progress Cards */}
            {/* ================================================= */}

            {progress.length === 0 ? (
                <div className="empty-progress">No completed sessions yet.</div>
            ) : (
                <section>
                    <h2>Exercise Progress</h2>

                    <div className="progress-grid">
                        {progress.map((item) => (
                            <ProgressCard key={item._id} progress={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* ================================================= */}
            {/* Session History */}
            {/* ================================================= */}

            <section className="session-history">
                <div className="history-header">
                    <h2>Session History</h2>

                    <select
                        value={selectedExercise}
                        onChange={(event) =>
                            setSelectedExercise(event.target.value)
                        }
                    >
                        <option value="ALL">All Exercises</option>

                        {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                            </option>
                        ))}
                    </select>
                </div>

                {filteredSessions.length === 0 ? (
                    <div className="empty-progress">No sessions found.</div>
                ) : (
                    <div className="session-list">
                        {filteredSessions.map((session) => (
                            <SessionRow key={session._id} session={session} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// =============================================================
// Progress Card
// =============================================================

function ProgressCard({ progress }) {
    const accuracy = Math.round(progress.averageAccuracy || 0);

    const lastAccuracy = Math.round(progress.lastAccuracy || 0);

    return (
        <div className="progress-card">
            <div className="progress-card-header">
                <div>
                    <h3>{progress.exercise?.name || "Exercise"}</h3>

                    <span>{progress.totalSessions} sessions</span>
                </div>

                <TrendBadge trend={progress.trend} />
            </div>

            <div className="accuracy-display">
                <strong>{accuracy}</strong>

                <span>average accuracy</span>
            </div>

            <div className="progress-card-stats">
                <div>
                    <span>Total Reps</span>

                    <strong>{progress.totalReps}</strong>
                </div>

                <div>
                    <span>Latest</span>

                    <strong>{lastAccuracy}</strong>
                </div>
            </div>

            <div className="accuracy-bar">
                <div
                    style={{
                        width: `${Math.min(100, accuracy)}%`,
                    }}
                />
            </div>
        </div>
    );
}

// =============================================================
// Trend Badge
// =============================================================

function TrendBadge({ trend }) {
    const label =
        trend === "IMPROVING"
            ? "Improving"
            : trend === "DECLINING"
              ? "Declining"
              : "Stable";

    return (
        <span
            className={`trend-badge ${String(trend || "STABLE").toLowerCase()}`}
        >
            {label}
        </span>
    );
}

// =============================================================
// Session Row
// =============================================================

function SessionRow({ session }) {
    const score = Math.round(session.averageScore || 0);

    const date = session.completedAt
        ? new Date(session.completedAt).toLocaleDateString()
        : "—";

    const duration = formatDuration(session.duration);

    return (
        <div className="session-row">
            <div>
                <strong>{session.exercise?.name || "Exercise"}</strong>

                <span>{date}</span>
            </div>

            <div>
                <span>Reps</span>

                <strong>{session.completedReps}</strong>
            </div>

            <div>
                <span>Score</span>

                <strong>{score}</strong>
            </div>

            <div>
                <span>Duration</span>

                <strong>{duration}</strong>
            </div>
        </div>
    );
}

// =============================================================
// Helpers
// =============================================================

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
