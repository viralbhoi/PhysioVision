import { useNavigate } from "react-router-dom";
import "./summary.css";

const SessionSummary = ({ assignment, result }) => {
    const navigate = useNavigate();

    const duration = result.duration || 0;

    const minutes = Math.floor(duration / 60);

    const seconds = duration % 60;

    const scores = result.repScores || [];

    return (
        <div className="session-summary">
            <header>
                <h1>Session Complete</h1>

                <p>{assignment.exercise.name}</p>
            </header>

            <section className="summary-stats">
                <div className="summary-card">
                    <span>Reps Completed</span>

                    <strong>{result.completedReps}</strong>
                </div>

                <div className="summary-card">
                    <span>Average Score</span>

                    <strong>{Math.round(result.averageScore)}</strong>
                </div>

                <div className="summary-card">
                    <span>Duration</span>

                    <strong>
                        {minutes}m {seconds}s
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Target Reps</span>

                    <strong>{assignment.targetReps}</strong>
                </div>
            </section>

            <section className="rep-results">
                <h2>Rep Performance</h2>

                {scores.length === 0 ? (
                    <p>No repetition scores recorded.</p>
                ) : (
                    <div className="rep-list">
                        {scores.map((score, index) => (
                            <div className="rep-row" key={index}>
                                <span>Rep {index + 1}</span>

                                <strong>{Math.round(score)}</strong>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="summary-actions">
                <button onClick={() => navigate("/patient")}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default SessionSummary;
