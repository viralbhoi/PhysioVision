import { useEffect, useRef, useState } from "react";
import PoseTracker from "../components/PoseTracker";
import SessionSummary from "../components/SessionSummary";

import { startSession, completeSession } from "../services/api";

function ExerciseSession({ assignment, onBack }) {
    const [session, setSession] = useState(null);

    const [latestResult, setLatestResult] = useState(null);

    const [loading, setLoading] = useState(true);

    const [finishing, setFinishing] = useState(false);

    const [error, setError] = useState("");

    const [completedSession, setCompletedSession] = useState(null);

    const startTimeRef = useRef(null);

    const timerRef = useRef(null);

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // =========================================================
    // Start Backend Session
    // =========================================================

    useEffect(() => {
        let mounted = true;

        const initializeSession = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await startSession(assignment._id);

                if (!mounted) {
                    return;
                }

                setSession(response.session);

                startTimeRef.current = Date.now();

                timerRef.current = setInterval(() => {
                    if (!startTimeRef.current) {
                        return;
                    }

                    const elapsed = Math.floor(
                        (Date.now() - startTimeRef.current) / 1000,
                    );

                    setElapsedSeconds(elapsed);
                }, 1000);

                setLoading(false);
            } catch (err) {
                console.error("Unable to start session:", err);

                if (!mounted) {
                    return;
                }

                setError(err.message || "Unable to start exercise session.");

                setLoading(false);
            }
        };

        initializeSession();

        return () => {
            mounted = false;

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [assignment._id]);

    // =========================================================
    // Receive Live ROMJudge Result
    // =========================================================

    const handleResult = (result) => {
        setLatestResult(result);
    };

    // =========================================================
    // Finish Session
    // =========================================================

    const handleFinish = async () => {
        if (!session || finishing) {
            return;
        }

        try {
            setFinishing(true);
            setError("");

            const reps = latestResult?.reps ?? 0;

            const averageScore =
                latestResult?.averageScore ?? latestResult?.score ?? 0;

            const repScores = latestResult?.repScores ?? [];

            const response = await completeSession(session._id, {
                completedReps: reps,

                averageScore: averageScore,

                repScores: repScores,

                duration: elapsedSeconds,
            });

            if (timerRef.current) {
                clearInterval(timerRef.current);

                timerRef.current = null;
            }

            setCompletedSession(response.session);
        } catch (err) {
            console.error("Unable to complete session:", err);

            setError(err.message || "Unable to complete session.");

            setFinishing(false);
        }
    };

    // =========================================================
    // Loading
    // =========================================================

    if (loading) {
        return (
            <div className="exercise-session">
                <div className="session-loading">Starting exercise...</div>
            </div>
        );
    }

    // =========================================================
    // Error
    // =========================================================

    if (error && !session) {
        return (
            <div className="exercise-session">
                <div className="session-error">
                    <p>{error}</p>

                    <button type="button" onClick={onBack}>
                        Back
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // Session Completed
    // =========================================================

    if (completedSession) {
        return (
            <SessionSummary
                session={completedSession}
                assignment={assignment}
                onBack={onBack}
            />
        );
    }

    // =========================================================
    // Active Session
    // =========================================================

    return (
        <div className="exercise-session">
            <header className="session-header">
                <div>
                    <button type="button" onClick={onBack} disabled={finishing}>
                        ← Back
                    </button>

                    <h1>{assignment.exercise?.name || "Exercise"}</h1>

                    {assignment.exercise?.description && (
                        <p>{assignment.exercise.description}</p>
                    )}
                </div>

                <div className="session-timer">
                    {formatTime(elapsedSeconds)}
                </div>
            </header>

            <div className="session-target">
                <span>Target</span>

                <strong>{assignment.targetReps}</strong>

                <span>reps</span>

                {assignment.sets > 1 && (
                    <>
                        <span>•</span>

                        <strong>{assignment.sets}</strong>

                        <span>sets</span>
                    </>
                )}
            </div>

            {error && <div className="session-error">{error}</div>}

            <PoseTracker
                exercise={assignment.exercise}
                onResult={handleResult}
            />

            <div className="session-actions">
                <div className="session-live-info">
                    <div>
                        <span>Completed</span>

                        <strong>
                            {latestResult?.reps ?? 0}/{assignment.targetReps}
                        </strong>
                    </div>

                    <div>
                        <span>Current Score</span>

                        <strong>{Math.round(latestResult?.score ?? 0)}</strong>
                    </div>

                    <div>
                        <span>Phase</span>

                        <strong>{latestResult?.phase ?? "RESTING"}</strong>
                    </div>
                </div>

                <button
                    type="button"
                    className="finish-session-button"
                    onClick={handleFinish}
                    disabled={finishing}
                >
                    {finishing ? "Saving Session..." : "Finish Session"}
                </button>
            </div>
        </div>
    );
}

// =============================================================
// Helpers
// =============================================================

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds,
    ).padStart(2, "0")}`;
}

export default ExerciseSession;
