import { useEffect, useRef, useState } from "react";

import ReferenceVideoCalibratorEngine from "../engine/ReferenceVideoCalibrator.js";

import { createExercise } from "../services/api";

const ReferenceVideoCalibrator = ({ onCreated, onCancel }) => {
    const engineRef = useRef(null);

    const [file, setFile] = useState(null);

    const [videoPreview, setVideoPreview] = useState("");

    const [status, setStatus] = useState("IDLE");

    const [progress, setProgress] = useState(0);

    const [validFrames, setValidFrames] = useState(0);

    const [processedFrames, setProcessedFrames] = useState(0);

    const [configuration, setConfiguration] = useState(null);

    const [name, setName] = useState("");

    const [description, setDescription] = useState("");

    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);

    // =========================================================
    // Cleanup
    // =========================================================

    useEffect(() => {
        return () => {
            engineRef.current?.dispose();

            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, []);

    // =========================================================
    // File selected
    // =========================================================

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        setFile(selectedFile);

        setError("");

        setConfiguration(null);

        setStatus("READY");

        const url = URL.createObjectURL(selectedFile);

        setVideoPreview(url);
    };

    // =========================================================
    // Start calibration
    // =========================================================

    const startCalibration = async () => {
        if (!file) {
            setError("Please select a reference video.");

            return;
        }

        try {
            setError("");

            setStatus("CALIBRATING");

            setProgress(0);

            setValidFrames(0);

            setProcessedFrames(0);

            const engine = new ReferenceVideoCalibratorEngine({
                onProgress: ({ progress, processedFrames, validFrames }) => {
                    setProgress(Math.round(progress));

                    setProcessedFrames(processedFrames);

                    setValidFrames(validFrames);
                },

                onComplete: (result) => {
                    setConfiguration(result);

                    setStatus("COMPLETED");
                },

                onError: (error) => {
                    console.error(error);

                    setError(error.message);

                    setStatus("ERROR");
                },
            });

            engineRef.current = engine;

            await engine.calibrate(file);
        } catch (err) {
            console.error(err);

            setError(err.message);

            setStatus("ERROR");
        }
    };

    // =========================================================
    // Save exercise
    // =========================================================

    const saveExercise = async () => {
        if (!configuration) {
            return;
        }

        if (!name.trim()) {
            setError("Exercise name is required.");

            return;
        }

        try {
            setSaving(true);

            setError("");

            const data = await createExercise({
                name: name.trim(),

                description: description.trim(),

                referenceVideo: file?.name || null,

                configuration: {
                    primaryJoints: configuration.primaryJoints,

                    allJoints: configuration.allJoints,

                    tolerance: configuration.tolerance,

                    goldenTrajectory: configuration.goldenTrajectory,
                },
            });

            onCreated?.(data.exercise);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // Cancel calibration
    // =========================================================

    const cancelCalibration = () => {
        engineRef.current?.cancel();

        setStatus("IDLE");

        setProgress(0);

        setConfiguration(null);
    };

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="reference-calibrator">
            <header>
                <h1>Create Exercise from Reference Video</h1>

                <p>
                    Upload a reference movement and PhysioVision will
                    automatically determine the movement range.
                </p>
            </header>

            {error && <div className="error-message">{error}</div>}

            {/* =============================================
                Upload
            ============================================= */}

            {status === "IDLE" || status === "READY" ? (
                <section>
                    <label>
                        Reference Video
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                        />
                    </label>

                    {videoPreview && (
                        <video
                            src={videoPreview}
                            controls
                            muted
                            className="reference-preview"
                        />
                    )}

                    {file && <p>Selected: {file.name}</p>}

                    <div className="form-actions">
                        <button onClick={onCancel}>Cancel</button>

                        <button onClick={startCalibration} disabled={!file}>
                            Start Calibration
                        </button>
                    </div>
                </section>
            ) : null}

            {/* =============================================
                Calibration
            ============================================= */}

            {status === "CALIBRATING" && (
                <section>
                    <h2>Calibrating...</h2>

                    <div className="progress-container">
                        <div
                            className="progress-bar"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>

                    <p>{progress}%</p>

                    <p>Processed frames: {processedFrames}</p>

                    <p>Valid pose frames: {validFrames}</p>

                    <button onClick={cancelCalibration}>Cancel</button>
                </section>
            )}

            {/* =============================================
                Result
            ============================================= */}

            {status === "COMPLETED" && configuration && (
                <section>
                    <h2>Calibration Complete</h2>

                    <div className="calibration-summary">
                        <div>
                            <strong>Primary Joint</strong>

                            <span>
                                {configuration.primaryJoints.join(", ")}
                            </span>
                        </div>

                        <div>
                            <strong>Valid Frames</strong>

                            <span>{configuration.validFrames}</span>
                        </div>

                        <div>
                            <strong>Tolerance</strong>

                            <span>{configuration.tolerance}°</span>
                        </div>
                    </div>

                    <h3>Detected ROM</h3>

                    <div className="rom-table">
                        {Object.entries(configuration.allJoints).map(
                            ([joint, data]) => (
                                <div className="rom-row" key={joint}>
                                    <span>{joint}</span>

                                    <span>
                                        {Math.round(data.min)}°{" → "}
                                        {Math.round(data.max)}°
                                    </span>

                                    <strong>
                                        ROM: {Math.round(data.range)}°
                                    </strong>
                                </div>
                            ),
                        )}
                    </div>

                    <div className="exercise-details">
                        <label>
                            Exercise Name
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Bicep Curl"
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="form-actions">
                        <button onClick={cancelCalibration}>Recalibrate</button>

                        <button
                            onClick={saveExercise}
                            disabled={saving || !name.trim()}
                        >
                            {saving ? "Saving..." : "Save Exercise"}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};

export default ReferenceVideoCalibrator;
