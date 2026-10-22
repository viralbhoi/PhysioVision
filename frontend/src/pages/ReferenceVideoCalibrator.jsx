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

    useEffect(() => {
        return () => {
            engineRef.current?.dispose();

            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, []);

    /* ========================================================= */
    /* File Selection */
    /* ========================================================= */

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }

        setFile(selectedFile);
        setError("");
        setConfiguration(null);
        setStatus("READY");
        setProgress(0);
        setValidFrames(0);
        setProcessedFrames(0);

        const url = URL.createObjectURL(selectedFile);
        setVideoPreview(url);
    };

    /* ========================================================= */
    /* Start Calibration */
    /* ========================================================= */

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

    /* ========================================================= */
    /* Save Exercise */
    /* ========================================================= */

    const saveExercise = async () => {
        if (!configuration) {
            return;
        }

        if (!file) {
            setError("Please select a reference video.");
            return;
        }

        if (!name.trim()) {
            setError("Exercise name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const formData = new FormData();

            formData.append("name", name.trim());
            formData.append("description", description.trim());
            formData.append("category", "PHYSIOTHERAPY");
            formData.append("trackingMode", "DYNAMIC");

            // Send the actual video bytes, not file?.name.
            formData.append("referenceVideo", file, file.name);

            // Preserve the existing calibration output.
            formData.append(
                "configuration",
                JSON.stringify({
                    primaryJoints: configuration.primaryJoints,
                    allJoints: configuration.allJoints,
                    tolerance: configuration.tolerance,
                    goldenTrajectory: configuration.goldenTrajectory,
                }),
            );

            const data = await createExercise(formData);

            onCreated?.(data.exercise);
        } catch (err) {
            console.error("Failed to create exercise:", err);
            setError(err.message || "Failed to upload the reference video.");
        } finally {
            setSaving(false);
        }
    };

    /* ========================================================= */
    /* Cancel / Recalibrate */
    /* ========================================================= */

    const cancelCalibration = () => {
        engineRef.current?.cancel();

        setStatus("IDLE");
        setProgress(0);
        setValidFrames(0);
        setProcessedFrames(0);
        setConfiguration(null);
        setError("");
    };

    /* ========================================================= */
    /* Error */
    /* ========================================================= */

    const ErrorMessage = () => {
        if (!error) return null;

        return (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                    </svg>
                </div>

                <div>
                    <p className="text-sm font-semibold text-red-800">
                        Something went wrong
                    </p>

                    <p className="mt-0.5 text-sm text-red-700">{error}</p>
                </div>
            </div>
        );
    };

    /* ========================================================= */
    /* Main UI */
    /* ========================================================= */

    return (
        <div className="w-full">
            {/* Header */}
            <header className="mb-7">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10l4.5-2.5A1 1 0 0 1 21 8.37v7.26a1 1 0 0 1-1.5.87L15 14"
                        />
                        <rect x="3" y="6" width="12" height="12" rx="2" />
                    </svg>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Create Exercise from Reference Video
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                    Upload a reference movement and PhysioVision will analyze
                    the video to determine the patient's expected range of
                    motion.
                </p>
            </header>

            <ErrorMessage />

            {/* ================================================= */}
            {/* Upload State */}
            {/* ================================================= */}

            {(status === "IDLE" ||
                status === "READY" ||
                status === "ERROR") && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-slate-900">
                            Reference Video
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Choose a video showing the exercise being performed
                            correctly.
                        </p>
                    </div>

                    <label className="block cursor-pointer">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div
                            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
                                file
                                    ? "border-blue-300 bg-blue-50/40"
                                    : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
                            }`}
                        >
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 16V4m0 0L7 9m5-5 5 5"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                                    />
                                </svg>
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                {file
                                    ? "Choose a different video"
                                    : "Upload reference video"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                MP4, WebM, MOV and other browser-supported
                                formats
                            </p>
                        </div>
                    </label>

                    {file && (
                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {videoPreview && (
                                <video
                                    src={videoPreview}
                                    controls
                                    muted
                                    className="max-h-105 w-full bg-black object-contain"
                                />
                            )}

                            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                        {file.name}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    Ready
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={startCalibration}
                            disabled={!file}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Start Calibration
                            <span>→</span>
                        </button>
                    </div>
                </section>
            )}

            {/* ================================================= */}
            {/* Calibration */}
            {/* ================================================= */}

            {status === "CALIBRATING" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <svg
                                        className="h-5 w-5 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            className="opacity-25"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />

                                        <path
                                            d="M21 12a9 9 0 0 0-9-9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Calibrating reference movement
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Analyzing pose landmarks and calculating
                                        joint ranges.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <span className="text-lg font-semibold text-blue-600">
                            {progress}%
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-7">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <StatBox
                            label="Processed Frames"
                            value={processedFrames}
                        />

                        <StatBox
                            label="Valid Pose Frames"
                            value={validFrames}
                        />
                    </div>

                    <div className="mt-6 rounded-xl bg-blue-50 px-4 py-3">
                        <p className="text-xs leading-5 text-blue-700">
                            Keep this window open while calibration is running.
                            The reference video is processed locally in the
                            browser.
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={cancelCalibration}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </section>
            )}

            {/* ================================================= */}
            {/* Calibration Result */}
            {/* ================================================= */}

            {status === "COMPLETED" && configuration && (
                <section className="space-y-5">
                    {/* Success header */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m7 12 3 3 7-7"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-emerald-900">
                                    Calibration Complete
                                </h2>

                                <p className="mt-1 text-sm text-emerald-700">
                                    The reference movement has been successfully
                                    analyzed.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <SummaryCard
                            label="Primary Joint"
                            value={
                                configuration.primaryJoints?.join(", ") || "—"
                            }
                        />

                        <SummaryCard
                            label="Valid Frames"
                            value={configuration.validFrames ?? validFrames}
                        />

                        <SummaryCard
                            label="Tolerance"
                            value={`${configuration.tolerance ?? 0}°`}
                        />
                    </div>

                    {/* ROM */}
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-base font-semibold text-slate-900">
                                Detected Range of Motion
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Joint ranges detected from the reference
                                movement.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {Object.entries(configuration.allJoints || {}).map(
                                ([joint, data]) => (
                                    <div
                                        className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-[1.5fr_1fr_auto] sm:items-center"
                                        key={joint}
                                    >
                                        <div>
                                            <p className="text-sm font-semibold capitalize text-slate-800">
                                                {joint.replaceAll("_", " ")}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Angle range
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {Math.round(data.min)}°{" "}
                                                <span className="mx-1 text-slate-300">
                                                    →
                                                </span>{" "}
                                                {Math.round(data.max)}°
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-xs text-slate-400">
                                                ROM
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-blue-600">
                                                {Math.round(data.range)}°
                                            </p>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    {/* Exercise details */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-slate-900">
                                Exercise Details
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Give the calibrated exercise a name and
                                description.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Exercise Name
                                </label>

                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Bicep Curl"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe how the patient should perform the exercise."
                                    rows={4}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={cancelCalibration}
                            disabled={saving}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Recalibrate
                        </button>

                        <button
                            type="button"
                            onClick={saveExercise}
                            disabled={saving || !name.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving && (
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                        className="opacity-25"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />

                                    <path
                                        d="M21 12a9 9 0 0 0-9-9"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}

                            {saving ? "Saving..." : "Save Exercise"}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};

/* ============================================================= */
/* Small Components */
/* ============================================================= */

function StatBox({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-2 wrap-break-word text-lg font-semibold capitalize text-slate-900">
                {String(value).replaceAll("_", " ")}
            </p>
        </div>
    );
}

function formatFileSize(bytes) {
    if (!bytes) {
        return "0 KB";
    }

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default ReferenceVideoCalibrator;
