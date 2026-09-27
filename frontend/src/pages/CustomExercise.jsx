import { useState } from "react";
import { createExercise } from "../services/api";

const CustomExercise = ({ onCreated, onCancel }) => {
    const [name, setName] = useState("");

    const [description, setDescription] = useState("");

    const [referenceVideo, setReferenceVideo] = useState("");

    const [primaryJoint, setPrimaryJoint] = useState("left_elbow");

    const [minAngle, setMinAngle] = useState(30);

    const [maxAngle, setMaxAngle] = useState(160);

    const [tolerance, setTolerance] = useState(15);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const configuration = {
                primaryJoints: [primaryJoint],

                allJoints: {
                    [primaryJoint]: {
                        min_angle: Number(minAngle),

                        max_angle: Number(maxAngle),
                    },
                },

                tolerance: Number(tolerance),

                // Golden trajectory can
                // be added later from
                // reference-video
                // processing.
                goldenTrajectory: [],
            };

            const data = await createExercise({
                name,
                description,
                referenceVideo: referenceVideo || null,
                configuration,
            });

            onCreated(data.exercise);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="custom-exercise">
            <h1>Create Custom Exercise</h1>

            <p>Define the basic movement configuration for the exercise.</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <label>
                    Exercise Name
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Bicep Curl"
                        required
                    />
                </label>

                <label>
                    Description
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Perform a controlled elbow flexion and extension."
                    />
                </label>

                <label>
                    Reference Video URL
                    <input
                        type="url"
                        value={referenceVideo}
                        onChange={(e) => setReferenceVideo(e.target.value)}
                        placeholder="https://..."
                    />
                </label>

                <label>
                    Primary Joint
                    <select
                        value={primaryJoint}
                        onChange={(e) => setPrimaryJoint(e.target.value)}
                    >
                        <option value="left_elbow">Left Elbow</option>

                        <option value="right_elbow">Right Elbow</option>

                        <option value="left_shoulder">Left Shoulder</option>

                        <option value="right_shoulder">Right Shoulder</option>

                        <option value="left_knee">Left Knee</option>

                        <option value="right_knee">Right Knee</option>

                        <option value="left_hip">Left Hip</option>

                        <option value="right_hip">Right Hip</option>
                    </select>
                </label>

                <label>
                    Minimum Angle
                    <input
                        type="number"
                        value={minAngle}
                        onChange={(e) => setMinAngle(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Maximum Angle
                    <input
                        type="number"
                        value={maxAngle}
                        onChange={(e) => setMaxAngle(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Tolerance
                    <input
                        type="number"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                        min="0"
                        required
                    />
                </label>

                <div className="form-actions">
                    <button type="button" onClick={onCancel}>
                        Cancel
                    </button>

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Exercise"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomExercise;
