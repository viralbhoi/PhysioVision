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
        <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="mb-7">
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
                            d="M12 4v16M4 12h16"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Create Custom Exercise
                </h1>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Define the movement and angle parameters used to evaluate
                    patient performance.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <svg
                        className="mt-0.5 h-5 w-5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                    </svg>

                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic information */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-slate-900">
                            Basic Information
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Provide the basic details for this exercise.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Exercise Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Bicep Curl"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Description
                            </label>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe how the patient should perform the movement."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Reference Video URL
                                <span className="ml-1.5 font-normal text-slate-400">
                                    Optional
                                </span>
                            </label>

                            <input
                                type="url"
                                value={referenceVideo}
                                onChange={(e) =>
                                    setReferenceVideo(e.target.value)
                                }
                                placeholder="https://..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            />

                            <p className="mt-1.5 text-xs text-slate-400">
                                A reference video can be used for future
                                trajectory calibration.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Movement configuration */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-slate-900">
                            Movement Configuration
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Define the joint and acceptable range of motion.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* Primary joint */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Primary Joint
                            </label>

                            <select
                                value={primaryJoint}
                                onChange={(e) =>
                                    setPrimaryJoint(e.target.value)
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            >
                                <option value="left_elbow">Left Elbow</option>
                                <option value="right_elbow">Right Elbow</option>
                                <option value="left_shoulder">
                                    Left Shoulder
                                </option>
                                <option value="right_shoulder">
                                    Right Shoulder
                                </option>
                                <option value="left_knee">Left Knee</option>
                                <option value="right_knee">Right Knee</option>
                                <option value="left_hip">Left Hip</option>
                                <option value="right_hip">Right Hip</option>
                            </select>
                        </div>

                        {/* Angle range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Acceptable Angle Range
                            </label>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                        Minimum Angle
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={minAngle}
                                            onChange={(e) =>
                                                setMinAngle(e.target.value)
                                            }
                                            min="0"
                                            max="360"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                        />

                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                            °
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                        Maximum Angle
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={maxAngle}
                                            onChange={(e) =>
                                                setMaxAngle(e.target.value)
                                            }
                                            min="0"
                                            max="360"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                        />

                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                            °
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tolerance */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Tolerance
                            </label>

                            <div className="relative">
                                <input
                                    type="number"
                                    value={tolerance}
                                    onChange={(e) =>
                                        setTolerance(e.target.value)
                                    }
                                    min="0"
                                    max="90"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                />

                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                    °
                                </span>
                            </div>

                            <p className="mt-1.5 text-xs text-slate-400">
                                Allowed deviation from the configured movement
                                range.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Preview */}
                <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                    <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0 text-blue-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path
                                    strokeLinecap="round"
                                    d="M12 11v5M12 8h.01"
                                />
                            </svg>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-800">
                                Configuration Preview
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                The{" "}
                                <span className="font-medium text-slate-700">
                                    {primaryJoint.replaceAll("_", " ")}
                                </span>{" "}
                                will be used as the primary movement joint, with
                                a target range of{" "}
                                <span className="font-medium text-slate-700">
                                    {minAngle}°–{maxAngle}°
                                </span>{" "}
                                and{" "}
                                <span className="font-medium text-slate-700">
                                    {tolerance}°
                                </span>{" "}
                                tolerance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading && (
                            <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className="opacity-90"
                                    d="M21 12a9 9 0 0 0-9-9"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}

                        {loading ? "Creating..." : "Create Exercise"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomExercise;
