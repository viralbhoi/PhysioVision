import { useEffect, useState } from "react";

import PoseTracker from "../components/PoseTracker";
import SessionSummary from "./SessionSummary";
import { startSession, completeSession } from "../services/api";

const ExerciseSession = ({ assignment }) => {
    const [session, setSession] = useState(null);

    const [latestResult, setLatestResult] = useState(null);

    const [startedAt, setStartedAt] = useState(null);

    const [elapsedTime, setElapsedTime] = useState(0);

    const [loading, setLoading] = useState(true);

    const [finishing, setFinishing] = useState(false);

    const [error, setError] = useState("");

    const [completedSession, setCompletedSession] = useState(null);

    // =====================================================
    // Start backend session
    // =====================================================

    useEffect(() => {
        const createSession = async () => {
            try {
                setLoading(true);

                const data = await startSession(assignment._id);

                setSession(data.session);

                setStartedAt(new Date());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        createSession();
    }, [assignment]);

    // =====================================================
    // Timer
    // =====================================================

    useEffect(() => {
        if (!startedAt) {
            return;
        }

        const interval = setInterval(() => {
            const seconds = Math.floor(
                (Date.now() - startedAt.getTime()) / 1000,
            );

            setElapsedTime(seconds);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    // =====================================================
    // Finish session
    // =====================================================

    const finishSession = async () => {
        if (!session || !latestResult) {
            return;
        }

        try {
            setFinishing(true);

            const result = latestResult;

            const completedReps = result.reps || 0;

            const repScores = result.repScores || [];

            const averageScore =
                repScores.length > 0
                    ? repScores.reduce((sum, score) => sum + score, 0) /
                      repScores.length
                    : 0;

            await completeSession(session._id, {
                completedReps,
                averageScore: Math.round(averageScore),

                repScores,

                duration: elapsedTime,
            });

            setCompletedSession({
                ...result,
                duration: elapsedTime,
                averageScore,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setFinishing(false);
        }
    };

    // =====================================================
    // Loading
    // =====================================================

    if (loading) {
        return <div>Starting exercise session...</div>;
    }

    if (error) {
        return (
            <div>
                <h2>Something went wrong</h2>

                <p>{error}</p>
            </div>
        );
    }

    if (completedSession) {
        return (
            <SessionSummary assignment={assignment} result={completedSession} />
        );
    }

    // =====================================================
    // Exercise UI
    // =====================================================

    return (
        <div className="exercise-session">
            <header>
                <div>
                    <h1>{assignment.exercise.name}</h1>

                    <p>{assignment.exercise.description}</p>
                </div>

                <div>Target: {assignment.targetReps} reps</div>
            </header>

            <main>
                <PoseTracker
                    exercise={assignment.exercise}
                    onResult={setLatestResult}
                />

                {latestResult && (
                    <div className="session-panel">
                        <div>
                            <span>Reps</span>

                            <strong>{latestResult.reps}</strong>
                        </div>

                        <div>
                            <span>Progress</span>

                            <strong>{latestResult.progress}%</strong>
                        </div>

                        <div>
                            <span>Current Score</span>

                            <strong>{latestResult.lastScore}</strong>
                        </div>

                        <div>
                            <span>Average Score</span>

                            <strong>{latestResult.avgScore}</strong>
                        </div>

                        <div>
                            <span>Phase</span>

                            <strong>{latestResult.state}</strong>
                        </div>

                        <div>
                            <span>Feedback</span>

                            <strong>{latestResult.feedback}</strong>
                        </div>
                    </div>
                )}

                <div className="session-controls">
                    <button
                        onClick={finishSession}
                        disabled={finishing || !latestResult}
                    >
                        {finishing ? "Saving..." : "Finish Session"}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ExerciseSession;
