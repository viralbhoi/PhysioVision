import React from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveMediaUrl(url) {
    if (!url) return "";

    if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) {
        return url;
    }

    return `${SERVER_ORIGIN}/${url.replace(/^\/+/, "")}`;
}

function ExerciseReferenceMedia({ exercise }) {
    const isStatic = exercise?.trackingMode === "STATIC";
    const imageUrl = resolveMediaUrl(exercise?.referenceImage);
    const videoUrl = resolveMediaUrl(exercise?.referenceVideo);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
                <h2 className="text-base font-semibold text-slate-900">
                    Reference {isStatic ? "Pose" : "Movement"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Follow the demonstration while performing your exercise.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl bg-slate-950">
                {isStatic && imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`Reference pose: ${exercise?.name || "Yoga pose"}`}
                        className="max-h-120 w-full object-contain"
                    />
                ) : videoUrl ? (
                    <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-120 w-full object-contain"
                    >
                        Your browser does not support video playback.
                    </video>
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`Reference exercise: ${exercise?.name || "Exercise"}`}
                        className="max-h-120 w-full object-contain"
                    />
                ) : (
                    <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-slate-300">
                        No reference media has been added for this exercise.
                    </div>
                )}
            </div>
        </section>
    );
}

export default ExerciseReferenceMedia;
