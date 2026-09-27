import { useEffect, useState } from "react";

import { getPatientProgress, getPatientSessions } from "../services/api";

const PatientProgress = ({ patient, onBack }) => {
    const [progress, setProgress] = useState([]);

    const [sessions, setSessions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, [patient]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [progressData, sessionsData] = await Promise.all([
                getPatientProgress(patient._id),
                getPatientSessions(patient._id),
            ]);

            setProgress(progressData.progress || []);

            setSessions(sessionsData.sessions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading patient progress...</div>;
    }

    return (
        <div className="patient-progress">
            <button onClick={onBack}>← Back</button>

            <header>
                <h1>{patient.user?.name}</h1>

                <p>{patient.user?.email}</p>
            </header>

            {error && <p>{error}</p>}

            {/* =====================================
                Exercise Progress
            ===================================== */}

            <section>
                <h2>Exercise Progress</h2>

                {progress.length === 0 ? (
                    <p>No completed exercises yet.</p>
                ) : (
                    <div className="progress-grid">
                        {progress.map((item) => (
                            <div className="progress-card" key={item._id}>
                                <h3>{item.exercise?.name}</h3>

                                <div>Sessions: {item.totalSessions}</div>

                                <div>Total Reps: {item.totalReps}</div>

                                <div>
                                    Average Accuracy:{" "}
                                    {Math.round(item.averageAccuracy)}%
                                </div>

                                <div>
                                    Latest Accuracy:{" "}
                                    {Math.round(item.lastAccuracy)}%
                                </div>

                                <div>Trend: {item.trend}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* =====================================
                Session History
            ===================================== */}

            <section>
                <h2>Session History</h2>

                {sessions.length === 0 ? (
                    <p>No completed sessions.</p>
                ) : (
                    <div className="session-history">
                        {sessions.map((session) => (
                            <div className="session-row" key={session._id}>
                                <div>
                                    <strong>{session.exercise?.name}</strong>

                                    <small>
                                        {session.completedAt
                                            ? new Date(
                                                  session.completedAt,
                                              ).toLocaleString()
                                            : "-"}
                                    </small>
                                </div>

                                <div>Reps: {session.completedReps}</div>

                                <div>
                                    Score: {Math.round(session.averageScore)}
                                </div>

                                <div>
                                    Duration:{" "}
                                    {Math.floor(session.duration / 60)}m{" "}
                                    {session.duration % 60}s
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PatientProgress;
