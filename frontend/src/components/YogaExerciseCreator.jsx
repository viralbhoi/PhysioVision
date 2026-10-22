import { useEffect, useRef, useState } from "react";

import ReferenceImageCalibrator from "../engine/ReferenceImageCalibrator";
import ReferenceVideoCalibratorEngine from "../engine/ReferenceVideoCalibrator";
import { createYogaExercise } from "../services/yogaApi";

const inputClass =
    "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const labelClass = "block text-sm font-medium text-slate-700";

export default function YogaExerciseCreator({ onCreated, onCancel }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState("STATIC");

    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);

    const [imagePreview, setImagePreview] = useState("");
    const [videoPreview, setVideoPreview] = useState("");

    const [targetHoldSeconds, setTargetHoldSeconds] = useState(30);
    const [matchThreshold, setMatchThreshold] = useState(75);

    const [referencePose, setReferencePose] = useState(null);
    const [dynamicConfiguration, setDynamicConfiguration] = useState(null);

    const [calibrating, setCalibrating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processedFrames, setProcessedFrames] = useState(0);
    const [validFrames, setValidFrames] = useState(0);
    const [error, setError] = useState("");

    const calibratorRef = useRef(null);

    useEffect(() => {
        return () => {
            calibratorRef.current?.dispose?.();
            calibratorRef.current?.close?.();

            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }

            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, [imagePreview, videoPreview]);

    const chooseImage = (file) => {
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("Choose a JPG, PNG, or WEBP image.");
            return;
        }

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setReferencePose(null);
        setError("");
        setImagePreview(URL.createObjectURL(file));
    };

    const chooseVideo = (file) => {
        if (!file) return;

        if (
            !["video/mp4", "video/webm", "video/quicktime"].includes(file.type)
        ) {
            setError("Choose an MP4, WEBM, or MOV video.");
            return;
        }

        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }

        setVideoFile(file);
        setDynamicConfiguration(null);
        setError("");
        setVideoPreview(URL.createObjectURL(file));
    };

    const calibrateImage = async () => {
        if (!imageFile) {
            setError("Choose a reference image first.");
            return;
        }

        setCalibrating(true);
        setError("");

        try {
            calibratorRef.current?.close?.();

            const calibrator = new ReferenceImageCalibrator();
            calibratorRef.current = calibrator;

            const configuration = await calibrator.calibrate(imageFile);

            setReferencePose(configuration);
        } catch (err) {
            setError(err.message || "Reference image calibration failed.");
        } finally {
            calibratorRef.current?.close?.();
            calibratorRef.current = null;
            setCalibrating(false);
        }
    };

    const calibrateVideo = async () => {
        if (!videoFile) {
            setError("Choose a reference video first.");
            return;
        }

        setCalibrating(true);
        setError("");
        setProgress(0);
        setProcessedFrames(0);
        setValidFrames(0);
        setDynamicConfiguration(null);

        try {
            const engine = new ReferenceVideoCalibratorEngine({
                onProgress: ({
                    progress: nextProgress,
                    processedFrames: processed,
                    validFrames: valid,
                }) => {
                    setProgress(Math.round(nextProgress));
                    setProcessedFrames(processed);
                    setValidFrames(valid);
                },

                onComplete: (configuration) => {
                    setDynamicConfiguration(configuration);
                },

                onError: (err) => {
                    setError(err.message || "Video calibration failed.");
                },
            });

            calibratorRef.current?.dispose?.();
            calibratorRef.current = engine;

            const configuration = await engine.calibrate(videoFile);

            // Supports engines that return the result directly.
            if (configuration) {
                setDynamicConfiguration(configuration);
            }
        } catch (err) {
            setError(err.message || "Video calibration failed.");
        } finally {
            calibratorRef.current?.dispose?.();
            calibratorRef.current = null;
            setCalibrating(false);
        }
    };

    const saveExercise = async (event) => {
        event.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Exercise name is required.");
            return;
        }

        if (mode === "STATIC" && !referencePose) {
            setError("Analyze the reference image before saving.");
            return;
        }

        if (mode === "DYNAMIC" && !dynamicConfiguration) {
            setError("Calibrate the reference video before saving.");
            return;
        }

        setSaving(true);

        try {
            const configuration =
                mode === "STATIC"
                    ? {
                          primaryJoints: referencePose.angles.map(
                              (joint) => joint.name,
                          ),
                          allJoints: {},
                          tolerance: 15,
                          goldenTrajectory: [],
                          referencePose,
                      }
                    : {
                          primaryJoints:
                              dynamicConfiguration.primaryJoints || [],
                          allJoints: dynamicConfiguration.allJoints || {},
                          tolerance: dynamicConfiguration.tolerance ?? 15,
                          goldenTrajectory:
                              dynamicConfiguration.goldenTrajectory || [],
                      };

            const response = await createYogaExercise({
                name: name.trim(),
                description: description.trim(),
                trackingMode: mode,
                imageFile: mode === "STATIC" ? imageFile : null,
                videoFile: mode === "DYNAMIC" ? videoFile : null,
                targetHoldSeconds:
                    mode === "STATIC" ? Number(targetHoldSeconds) : null,
                matchThreshold: mode === "STATIC" ? Number(matchThreshold) : 75,
                configuration,
            });

            onCreated?.(response.exercise);
        } catch (err) {
            setError(err.message || "Unable to save yoga exercise.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-4xl">
                <header className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                        PhysioVision · Exercise library
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        Create a yoga exercise
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Configure a static pose hold or a dynamic movement using
                        your reference media.
                    </p>
                </header>

                <form
                    onSubmit={saveExercise}
                    className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                        >
                            {error}
                        </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className={labelClass}>
                            Exercise name
                            <input
                                className={inputClass}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="e.g. Tree Pose"
                                required
                            />
                        </label>

                        <label className={labelClass}>
                            Tracking mode
                            <select
                                className={inputClass}
                                value={mode}
                                onChange={(event) => {
                                    setMode(event.target.value);
                                    setError("");
                                }}
                            >
                                <option value="STATIC">Static pose hold</option>
                                <option value="DYNAMIC">
                                    Dynamic movement
                                </option>
                            </select>
                        </label>
                    </div>

                    <label className={labelClass}>
                        Description / instructions
                        <textarea
                            className={inputClass}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            rows={3}
                            placeholder="Describe the pose and important alignment notes."
                        />
                    </label>

                    {mode === "STATIC" ? (
                        <section className="space-y-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Reference pose image
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Choose an image where the full body and
                                    relevant joints are visible.
                                </p>
                            </div>

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                    chooseImage(event.target.files?.[0])
                                }
                                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-100"
                            />

                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt="Selected yoga pose reference"
                                    className="max-h-80 w-full rounded-xl border border-slate-200 bg-white object-contain"
                                />
                            )}

                            <button
                                type="button"
                                onClick={calibrateImage}
                                disabled={!imageFile || calibrating}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {calibrating
                                    ? "Analyzing image..."
                                    : "Analyze reference image"}
                            </button>

                            {referencePose && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    Reference analyzed:{" "}
                                    {referencePose.angles.length} joint angles
                                    and {referencePose.usableLandmarks} visible
                                    landmarks detected.
                                </div>
                            )}

                            <div className="grid gap-5 sm:grid-cols-2">
                                <label className={labelClass}>
                                    Target hold duration (seconds)
                                    <input
                                        className={inputClass}
                                        type="number"
                                        min="1"
                                        max="3600"
                                        value={targetHoldSeconds}
                                        onChange={(event) =>
                                            setTargetHoldSeconds(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <label className={labelClass}>
                                    Pose match threshold (%)
                                    <input
                                        className={inputClass}
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={matchThreshold}
                                        onChange={(event) =>
                                            setMatchThreshold(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>
                            </div>

                            <p className="text-xs leading-5 text-slate-500">
                                The default 75% threshold is a starting point
                                and is not clinically validated.
                            </p>
                        </section>
                    ) : (
                        <section className="space-y-4 rounded-xl border border-slate-200 p-4">
                            <h2 className="font-semibold text-slate-900">
                                Dynamic reference video
                            </h2>

                            <p className="text-sm text-slate-600">
                                This uses the existing reference-video
                                calibration engine.
                            </p>

                            <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={(event) =>
                                    chooseVideo(event.target.files?.[0])
                                }
                                className="block w-full text-sm text-slate-600"
                            />

                            {videoPreview && (
                                <video
                                    src={videoPreview}
                                    controls
                                    muted
                                    className="max-h-80 w-full rounded-xl border border-slate-200 bg-black"
                                />
                            )}

                            <button
                                type="button"
                                onClick={calibrateVideo}
                                disabled={!videoFile || calibrating}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {calibrating
                                    ? `Calibrating... ${progress}%`
                                    : "Calibrate reference video"}
                            </button>

                            {calibrating && (
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full bg-blue-600"
                                        style={{
                                            width: `${progress}%`,
                                        }}
                                    />
                                </div>
                            )}

                            {dynamicConfiguration && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    Video calibration complete. {validFrames}{" "}
                                    valid frames from {processedFrames}{" "}
                                    processed frames.
                                </div>
                            )}
                        </section>
                    )}

                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving || calibrating}
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save yoga exercise"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
