import "./SessionSummary.css";

function SessionSummary({ session, assignment, onBack }) {
    const targetReps = assignment?.targetReps ?? session?.targetReps ?? 0;

    const completedReps = session?.completedReps ?? 0;

    const averageScore = Math.round(session?.averageScore ?? 0);

    const duration = session?.duration ?? 0;

    const repScores = session?.repScores ?? [];

    const completionPercentage =
        targetReps > 0
            ? Math.min(100, Math.round((completedReps / targetReps) * 100))
            : 0;

    return (
        <div className="session-summary">
            <div className="summary-header">
                <span className="summary-label">Exercise Complete</span>

                <h1>{assignment?.exercise?.name || "Exercise Session"}</h1>

                <p>Your session has been recorded successfully.</p>
            </div>

            <div className="summary-main">
                <div className="summary-score">
                    <span>Overall Score</span>

                    <strong>{averageScore}</strong>

                    <small>/ 100</small>
                </div>

                <div className="summary-progress">
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${completionPercentage}%`,
                            }}
                        />
                    </div>

                    <span>
                        {completedReps} / {targetReps} reps
                    </span>
                </div>
            </div>

            <div className="summary-stats">
                <div className="summary-stat">
                    <span>Repetitions</span>

                    <strong>{completedReps}</strong>
                </div>

                <div className="summary-stat">
                    <span>Target</span>

                    <strong>{targetReps}</strong>
                </div>

                <div className="summary-stat">
                    <span>Duration</span>

                    <strong>{formatDuration(duration)}</strong>
                </div>

                <div className="summary-stat">
                    <span>Status</span>

                    <strong>{session?.status || "COMPLETED"}</strong>
                </div>
            </div>

            {repScores.length > 0 && (
                <div className="rep-score-section">
                    <h2>Repetition Scores</h2>

                    <div className="rep-score-list">
                        {repScores.map((score, index) => (
                            <div className="rep-score" key={index}>
                                <span>Rep {index + 1}</span>

                                <strong>{Math.round(score)}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="summary-message">
                {averageScore >= 85 ? (
                    <>
                        <strong>Excellent work.</strong>

                        <span>Your movement quality was very good.</span>
                    </>
                ) : averageScore >= 70 ? (
                    <>
                        <strong>Good session.</strong>

                        <span>Keep working on consistency and form.</span>
                    </>
                ) : averageScore >= 50 ? (
                    <>
                        <strong>Session completed.</strong>

                        <span>
                            Focus on controlled movement and proper form.
                        </span>
                    </>
                ) : (
                    <>
                        <strong>Keep practicing.</strong>

                        <span>
                            Try to follow the prescribed movement more closely
                            next time.
                        </span>
                    </>
                )}
            </div>

            <button
                type="button"
                className="summary-back-button"
                onClick={onBack}
            >
                Back to Dashboard
            </button>
        </div>
    );
}

function formatDuration(seconds) {
    const totalSeconds = Number(seconds) || 0;

    const minutes = Math.floor(totalSeconds / 60);

    const remaining = totalSeconds % 60;

    if (minutes === 0) {
        return `${remaining}s`;
    }

    return `${minutes}m ${remaining}s`;
}

export default SessionSummary;
