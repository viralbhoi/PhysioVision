import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

import StaticYogaHoldPanel from "./StaticYogaHoldPanel";
import { extractStaticPoseFeatures } from "../engine/staticPoseFeatures";

const WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const REQUIRED_VISIBILITY = 0.6;
const DEFAULT_THRESHOLD = 75;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getReferencePose(exercise) {
    return exercise?.configuration?.referencePose ?? null;
}

function getLandmarkVisibility(landmark) {
    return Number(landmark?.visibility ?? landmark?.presence ?? 0);
}

function angleDifference(a, b) {
    const difference = Math.abs(Number(a) - Number(b));
    return Math.min(difference, 360 - difference);
}

function calculateAngleScore(referenceAngles, currentAngles) {
    if (
        !referenceAngles ||
        !currentAngles ||
        typeof referenceAngles !== "object"
    ) {
        return null;
    }

    const keys = Object.keys(referenceAngles).filter(
        (key) =>
            Number.isFinite(Number(referenceAngles[key])) &&
            Number.isFinite(Number(currentAngles[key])),
    );

    if (keys.length === 0) return null;

    const scores = keys.map((key) => {
        const difference = angleDifference(
            referenceAngles[key],
            currentAngles[key],
        );

        // A 45-degree difference receives a zero score.
        return clamp(100 * (1 - difference / 45), 0, 100);
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function calculateLandmarkScore(referenceLandmarks, currentLandmarks) {
    if (!Array.isArray(referenceLandmarks)) return null;
    if (!Array.isArray(currentLandmarks)) return null;

    const count = Math.min(referenceLandmarks.length, currentLandmarks.length);

    if (count === 0) return null;

    const distances = [];

    for (let index = 0; index < count; index += 1) {
        const reference = referenceLandmarks[index];
        const current = currentLandmarks[index];

        if (!reference || !current) continue;

        const rx = Number(reference.x);
        const ry = Number(reference.y);
        const rz = Number(reference.z ?? 0);

        const cx = Number(current.x);
        const cy = Number(current.y);
        const cz = Number(current.z ?? 0);

        if (
            !Number.isFinite(rx) ||
            !Number.isFinite(ry) ||
            !Number.isFinite(rz) ||
            !Number.isFinite(cx) ||
            !Number.isFinite(cy) ||
            !Number.isFinite(cz)
        ) {
            continue;
        }

        distances.push(
            Math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2 + (rz - cz) ** 2),
        );
    }

    if (distances.length === 0) return null;

    const averageDistance =
        distances.reduce((sum, value) => sum + value, 0) / distances.length;

    // Landmark coordinates are normalized relative to body size.
    return clamp(100 * (1 - averageDistance / 0.8), 0, 100);
}

function evaluatePose(referencePose, features, threshold) {
    if (!referencePose || !features) {
        return {
            score: 0,
            matched: false,
            status: "Reference pose configuration is missing.",
        };
    }

    const angles = features.angles ?? features.jointAngles ?? {};

    const referenceAngles =
        referencePose.angles ??
        referencePose.jointAngles ??
        referencePose.referenceAngles ??
        {};

    const referenceLandmarks =
        referencePose.relativeLandmarks ??
        referencePose.landmarks ??
        referencePose.normalizedLandmarks ??
        [];

    const currentLandmarks =
        features.relativeLandmarks ?? features.normalizedLandmarks ?? [];

    const angleScore = calculateAngleScore(referenceAngles, angles);

    const landmarkScore = calculateLandmarkScore(
        referenceLandmarks,
        currentLandmarks,
    );

    const availableScores = [angleScore, landmarkScore].filter(
        (score) => score !== null,
    );

    if (availableScores.length === 0) {
        return {
            score: 0,
            matched: false,
            status: "Unable to compare this pose with the reference.",
        };
    }

    // Joint angles are the primary signal; landmarks add body alignment.
    const score =
        angleScore !== null && landmarkScore !== null
            ? angleScore * 0.7 + landmarkScore * 0.3
            : availableScores[0];

    const roundedScore = Math.round(score);

    return {
        score: roundedScore,
        matched: roundedScore >= threshold,
        status:
            roundedScore >= threshold
                ? "Pose matched. Hold this position."
                : "Adjust your position to match the reference.",
    };
}

function StaticYogaPoseTracker({ exercise, onResult, disabled = false }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const onResultRef = useRef(onResult);

    const holdRef = useRef({
        accumulatedMs: 0,
        intervalStart: null,
        enabled: false,
        completed: false,
    });

    const [cameraReady, setCameraReady] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    const [poseResult, setPoseResult] = useState({
        score: 0,
        matched: false,
        status: "Initializing pose tracking...",
    });
    const [holdState, setHoldState] = useState({
        elapsedSeconds: 0,
        enabled: false,
        completed: false,
    });
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState("");

    const targetHoldSeconds = Math.max(
        1,
        Number(exercise?.targetHoldSeconds ?? 30),
    );

    const threshold = clamp(
        Number(exercise?.matchThreshold ?? DEFAULT_THRESHOLD),
        1,
        100,
    );

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    const emitResult = useCallback(
        (nextPose, nextHold) => {
            onResultRef.current?.({
                score: nextPose.score,
                poseMatchScore: nextPose.score,
                status: nextPose.status,
                isPoseMatched: nextPose.matched,
                holdSeconds: nextHold.elapsedSeconds,
                heldSeconds: nextHold.elapsedSeconds,
                targetHoldSeconds,
                holdCompleted: nextHold.completed,
                trackingMode: "STATIC",
            });
        },
        [targetHoldSeconds],
    );

    const pauseHold = useCallback(() => {
        const hold = holdRef.current;

        if (hold.enabled && hold.intervalStart !== null) {
            hold.accumulatedMs += performance.now() - hold.intervalStart;
        }

        hold.intervalStart = null;
        hold.enabled = false;

        const elapsedSeconds = Math.floor(hold.accumulatedMs / 1000);

        setHoldState({
            elapsedSeconds,
            enabled: false,
            completed: hold.completed,
        });

        return {
            elapsedSeconds,
            enabled: false,
            completed: hold.completed,
        };
    }, []);

    const startHold = useCallback(() => {
        const hold = holdRef.current;

        if (disabled || hold.completed) return;

        if (!poseResult.matched) {
            setError(
                "Match the reference pose before starting or resuming the hold.",
            );
            return;
        }

        setError("");

        if (!hold.enabled) {
            hold.enabled = true;
            hold.intervalStart = performance.now();
        }

        setHoldState({
            elapsedSeconds: Math.floor(hold.accumulatedMs / 1000),
            enabled: true,
            completed: hold.completed,
        });
    }, [disabled, poseResult.matched]);

    const resetHold = useCallback(() => {
        holdRef.current = {
            accumulatedMs: 0,
            intervalStart: null,
            enabled: false,
            completed: false,
        };

        setHoldState({
            elapsedSeconds: 0,
            enabled: false,
            completed: false,
        });

        emitResult(poseResult, {
            elapsedSeconds: 0,
            enabled: false,
            completed: false,
        });
    }, [emitResult, poseResult]);

    // =========================================================
    // Initialize MediaPipe and camera
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            try {
                setInitializing(true);
                setError("");

                const vision = await FilesetResolver.forVisionTasks(WASM_URL);

                const landmarker = await PoseLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath: MODEL_URL,
                            delegate: "GPU",
                        },
                        runningMode: "VIDEO",
                        numPoses: 1,
                        minPoseDetectionConfidence: 0.5,
                        minPosePresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5,
                    },
                );

                if (cancelled) {
                    landmarker.close();
                    return;
                }

                landmarkerRef.current = landmarker;
                setModelReady(true);

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;

                const video = videoRef.current;

                if (!video) {
                    throw new Error("Camera video element is unavailable.");
                }

                video.srcObject = stream;
                await video.play();

                if (cancelled) return;

                setCameraReady(true);
                setInitializing(false);
            } catch (err) {
                console.error(
                    "Unable to initialize static yoga tracking:",
                    err,
                );

                if (!cancelled) {
                    setError(
                        err.message ||
                            "Unable to initialize camera-based pose tracking.",
                    );
                    setInitializing(false);
                }
            }
        };

        initialize();

        return () => {
            cancelled = true;

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (landmarkerRef.current) {
                landmarkerRef.current.close();
                landmarkerRef.current = null;
            }
        };
    }, []);

    // =========================================================
    // Process camera frames locally
    // =========================================================

    useEffect(() => {
        if (!cameraReady || !modelReady) return;

        let stopped = false;

        const processFrame = () => {
            if (stopped) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const landmarker = landmarkerRef.current;

            if (!video || !canvas || !landmarker || video.readyState < 2) {
                animationRef.current = requestAnimationFrame(processFrame);
                return;
            }

            const context = canvas.getContext("2d");

            if (!context) return;

            const width = video.videoWidth;
            const height = video.videoHeight;

            if (width === 0 || height === 0) {
                animationRef.current = requestAnimationFrame(processFrame);
                return;
            }

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            context.clearRect(0, 0, width, height);

            try {
                if (video.currentTime !== lastVideoTimeRef.current) {
                    lastVideoTimeRef.current = video.currentTime;

                    const result = landmarker.detectForVideo(
                        video,
                        performance.now(),
                    );

                    const landmarks = result.landmarks?.[0];
                    const worldLandmarks = result.worldLandmarks?.[0];

                    if (!landmarks || !worldLandmarks) {
                        const nextPose = {
                            score: 0,
                            matched: false,
                            status: "Move into the camera view.",
                        };

                        setPoseResult(nextPose);

                        // Losing the pose pauses the hold.
                        const nextHold = pauseHold();

                        emitResult(nextPose, nextHold);
                    } else {
                        const visibleCount = landmarks.filter(
                            (point) =>
                                getLandmarkVisibility(point) >=
                                REQUIRED_VISIBILITY,
                        ).length;

                        // Draw skeleton locally on the canvas.
                        drawPose(context, landmarks, width, height);

                        if (visibleCount < 15) {
                            const nextPose = {
                                score: 0,
                                matched: false,
                                status: "Keep your body visible in the camera.",
                            };

                            setPoseResult(nextPose);

                            const nextHold = pauseHold();

                            emitResult(nextPose, nextHold);
                        } else {
                            const features = extractStaticPoseFeatures(
                                worldLandmarks,
                                landmarks,
                            );

                            const referencePose = getReferencePose(exercise);

                            const nextPose = evaluatePose(
                                referencePose,
                                features,
                                threshold,
                            );

                            setPoseResult(nextPose);

                            let nextHold;

                            if (!nextPose.matched) {
                                // Pause automatically on pose loss.
                                // Resuming requires explicit user action.
                                nextHold = pauseHold();
                            } else {
                                const hold = holdRef.current;

                                if (
                                    hold.enabled &&
                                    hold.intervalStart !== null
                                ) {
                                    const now = performance.now();

                                    const elapsedMs =
                                        hold.accumulatedMs +
                                        (now - hold.intervalStart);

                                    const elapsedSeconds = Math.floor(
                                        elapsedMs / 1000,
                                    );

                                    if (elapsedSeconds >= targetHoldSeconds) {
                                        hold.accumulatedMs =
                                            targetHoldSeconds * 1000;
                                        hold.intervalStart = null;
                                        hold.enabled = false;
                                        hold.completed = true;
                                    }

                                    nextHold = {
                                        elapsedSeconds: Math.min(
                                            targetHoldSeconds,
                                            Math.floor(
                                                hold.accumulatedMs / 1000 +
                                                    (hold.enabled &&
                                                    hold.intervalStart !== null
                                                        ? (now -
                                                              hold.intervalStart) /
                                                          1000
                                                        : 0),
                                            ),
                                        ),
                                        enabled: hold.enabled,
                                        completed: hold.completed,
                                    };

                                    setHoldState(nextHold);
                                } else {
                                    nextHold = {
                                        elapsedSeconds: Math.floor(
                                            hold.accumulatedMs / 1000,
                                        ),
                                        enabled: false,
                                        completed: hold.completed,
                                    };
                                }
                            }

                            emitResult(nextPose, nextHold);
                        }
                    }
                }
            } catch (err) {
                console.error("Pose detection error:", err);
                setError("Pose detection failed. Please retry the session.");
                pauseHold();
            }

            animationRef.current = requestAnimationFrame(processFrame);
        };

        animationRef.current = requestAnimationFrame(processFrame);

        return () => {
            stopped = true;

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [
        cameraReady,
        modelReady,
        exercise,
        threshold,
        targetHoldSeconds,
        pauseHold,
        emitResult,
    ]);

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 sm:p-5">
                <h2 className="font-semibold text-slate-900">
                    Live Yoga Pose Tracking
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Your camera frames are processed locally in this browser.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="relative min-h-64 bg-slate-950">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="block h-full max-h-155 min-h-64 w-full object-contain"
                        style={{ transform: "scaleX(-1)" }}
                    />

                    <canvas
                        ref={canvasRef}
                        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                        style={{ transform: "scaleX(-1)" }}
                    />

                    {initializing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center text-sm text-white">
                            Initializing camera and pose detection...
                        </div>
                    )}

                    {!initializing && !error && (
                        <div className="absolute left-3 top-3">
                            <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    poseResult.matched
                                        ? "bg-emerald-500 text-white"
                                        : "bg-amber-500 text-slate-950"
                                }`}
                            >
                                {poseResult.matched
                                    ? "Pose matched"
                                    : "Adjust your pose"}
                            </span>
                        </div>
                    )}
                </div>

                <aside className="flex flex-col gap-4 p-4 sm:p-5">
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Pose match</p>

                        <p className="mt-1 text-3xl font-bold text-slate-900">
                            {Math.round(poseResult.score)}%
                        </p>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    poseResult.matched
                                        ? "bg-emerald-500"
                                        : "bg-amber-500"
                                }`}
                                style={{
                                    width: `${clamp(
                                        poseResult.score,
                                        0,
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>

                        <p className="mt-3 text-sm leading-5 text-slate-600">
                            {poseResult.status}
                        </p>
                    </div>

                    <StaticYogaHoldPanel
                        result={{
                            score: poseResult.score,
                            poseMatchScore: poseResult.score,
                            isPoseMatched: poseResult.matched,
                            status: poseResult.status,
                            holdSeconds: holdState.elapsedSeconds,
                            targetHoldSeconds,
                            holdCompleted: holdState.completed,
                            enabled: holdState.enabled,
                        }}
                        targetHoldSeconds={targetHoldSeconds}
                        onStateChange={(action) => {
                            if (action === "resume") {
                                startHold();
                            } else if (action === "pause") {
                                const nextHold = pauseHold();
                                emitResult(poseResult, nextHold);
                            } else if (action === "reset") {
                                resetHold();
                            }
                        }}
                    />

                    {holdState.completed && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            Target hold completed. You can finish the session
                            when you are ready.
                        </div>
                    )}

                    {disabled && (
                        <p className="text-sm text-slate-500">
                            Saving session results...
                        </p>
                    )}
                </aside>
            </div>
        </div>
    );
}

// =============================================================
// Lightweight skeleton drawing; all processing stays in browser
// =============================================================

function drawPose(context, landmarks, width, height) {
    const connections = [
        [11, 12],
        [11, 13],
        [13, 15],
        [12, 14],
        [14, 16],
        [11, 23],
        [12, 24],
        [23, 24],
        [23, 25],
        [25, 27],
        [24, 26],
        [26, 28],
        [27, 31],
        [28, 32],
        [15, 17],
        [15, 19],
        [16, 18],
        [16, 20],
    ];

    context.save();
    context.lineWidth = Math.max(2, width / 400);
    context.strokeStyle = "#34d399";
    context.fillStyle = "#f8fafc";

    for (const [startIndex, endIndex] of connections) {
        const start = landmarks[startIndex];
        const end = landmarks[endIndex];

        if (
            !start ||
            !end ||
            getLandmarkVisibility(start) < 0.4 ||
            getLandmarkVisibility(end) < 0.4
        ) {
            continue;
        }

        context.beginPath();
        context.moveTo(start.x * width, start.y * height);
        context.lineTo(end.x * width, end.y * height);
        context.stroke();
    }

    for (const landmark of landmarks) {
        if (getLandmarkVisibility(landmark) < 0.4) continue;

        context.beginPath();
        context.arc(
            landmark.x * width,
            landmark.y * height,
            Math.max(3, width / 240),
            0,
            Math.PI * 2,
        );
        context.fill();
    }

    context.restore();
}

export default StaticYogaPoseTracker;
