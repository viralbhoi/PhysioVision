import { useCallback, useEffect, useRef, useState } from "react";

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

import PhysioGeometry from "../engine/geometry";
import ROMJudge from "../engine/ROMJudge";
import FeedbackEngine from "../engine/FeedbackEngine";

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

const MIN_LANDMARK_CONFIDENCE = 0.6;
const MIN_RELIABLE_LANDMARKS = 8;

// Shoulders, elbows, wrists, hips, knees and ankles.
const REQUIRED_LANDMARKS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

function getLandmarkVisibility(point) {
    if (!point || !Number.isFinite(point.visibility)) {
        return 0;
    }

    return Math.max(0, Math.min(1, point.visibility));
}

function PoseTracker({ exercise, onResult, onReady, onStop }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const poseLandmarkerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);

    const judgeRef = useRef(null);
    const feedbackRef = useRef(null);

    const lastVideoTimeRef = useRef(-1);
    const runningRef = useRef(false);
    const stoppedRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [result, setResult] = useState(null);

    /* ========================================================= */
    /* Initialize ROM Judge */
    /* ========================================================= */

    useEffect(() => {
        if (!exercise) {
            judgeRef.current = null;
            return undefined;
        }

        judgeRef.current = new ROMJudge(exercise.configuration || exercise);

        feedbackRef.current = new FeedbackEngine();

        return () => {
            judgeRef.current?.reset();
            feedbackRef.current?.reset();

            judgeRef.current = null;
            feedbackRef.current = null;
        };
    }, [exercise]);

    /* ========================================================= */
    /* Publish invalid-pose state */
    /* ========================================================= */

    const publishInvalidPose = useCallback(
        (message = "Keep your body visible in the camera.") => {
            const judge = judgeRef.current;

            // Discard any incomplete cycle so it cannot become a rep
            // after tracking resumes.
            judge?.handleInvalidPose?.();

            const invalidResult = {
                reps: judge?.reps ?? 0,
                completedReps: judge?.reps ?? 0,

                state: "INVALID_POSE",
                phase: "INVALID_POSE",
                progress: 0,

                lastScore: judge?.lastRepScore ?? null,
                score: null,

                avgScore:
                    judge?.scoredReps > 0
                        ? judge.round(judge.averageScore)
                        : null,

                averageScore:
                    judge?.scoredReps > 0
                        ? judge.round(judge.averageScore)
                        : null,

                repScores: [...(judge?.repScores ?? [])],
                rejectedAttempts: [...(judge?.rejectedAttempts ?? [])],

                feedback: message,
                ttsFeedback: "",
                poseConfidence: 0,
                scoreAvailable: false,
                planeValid: false,
            };

            setResult(invalidResult);
            onResult?.(invalidResult);
        },
        [onResult],
    );

    /* ========================================================= */
    /* Initialize MediaPipe */
    /* ========================================================= */

    useEffect(() => {
        let mounted = true;

        const initializePoseLandmarker = async () => {
            try {
                setIsLoading(true);
                setError("");

                const vision = await FilesetResolver.forVisionTasks(WASM_URL);

                const poseLandmarker = await PoseLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath: MODEL_URL,
                            delegate: "GPU",
                        },

                        runningMode: "VIDEO",
                        numPoses: 1,

                        minPoseDetectionConfidence: 0.6,
                        minPosePresenceConfidence: 0.6,
                        minTrackingConfidence: 0.6,
                    },
                );

                if (!mounted) {
                    poseLandmarker.close();
                    return;
                }

                poseLandmarkerRef.current = poseLandmarker;

                setIsLoading(false);
                onReady?.();

                await startCamera();
            } catch (err) {
                console.error("PoseLandmarker initialization failed:", err);

                if (!mounted) return;

                setError(err.message || "Unable to initialize pose tracking.");

                setIsLoading(false);
            }
        };

        initializePoseLandmarker();

        return () => {
            mounted = false;
            stopTracking();
        };
        // Camera/model initialization intentionally runs once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ========================================================= */
    /* Start Camera */
    /* ========================================================= */

    const startCamera = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera access is not supported by this browser.",
                );
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: VIDEO_WIDTH },
                    height: { ideal: VIDEO_HEIGHT },
                    facingMode: "user",
                },
                audio: false,
            });

            streamRef.current = stream;

            const video = videoRef.current;

            if (!video) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            video.srcObject = stream;
            video.setAttribute("playsinline", "");

            await video.play();

            stoppedRef.current = false;
            runningRef.current = true;

            setCameraReady(true);

            processVideoFrame();
        } catch (err) {
            console.error("Camera initialization failed:", err);

            setError(err.message || "Unable to access camera.");
        }
    };

    /* ========================================================= */
    /* Main Video Loop */
    /* ========================================================= */

    const processVideoFrame = () => {
        if (!runningRef.current) return;

        const video = videoRef.current;
        const poseLandmarker = poseLandmarkerRef.current;

        if (
            !video ||
            !poseLandmarker ||
            video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            animationFrameRef.current =
                requestAnimationFrame(processVideoFrame);

            return;
        }

        const currentTime = video.currentTime;

        if (currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;

            try {
                const detection = poseLandmarker.detectForVideo(
                    video,
                    performance.now(),
                );

                handleDetection(detection);
            } catch (err) {
                console.error("Pose detection failed:", err);
                publishInvalidPose(
                    "Pose tracking failed. Reposition yourself and try again.",
                );
            }
        }

        if (runningRef.current) {
            animationFrameRef.current =
                requestAnimationFrame(processVideoFrame);
        }
    };

    /* ========================================================= */
    /* Validate Landmark Confidence */
    /* ========================================================= */

    const validateLandmarks = (landmarks) => {
        if (!Array.isArray(landmarks) || !landmarks.length) {
            return {
                valid: false,
                confidence: 0,
                reliableCount: 0,
            };
        }

        const requiredPoints = REQUIRED_LANDMARKS.map(
            (index) => landmarks[index],
        );

        const reliablePoints = requiredPoints.filter(
            (point) => getLandmarkVisibility(point) >= MIN_LANDMARK_CONFIDENCE,
        );

        const averageConfidence = reliablePoints.length
            ? reliablePoints.reduce(
                  (sum, point) => sum + getLandmarkVisibility(point),
                  0,
              ) / reliablePoints.length
            : 0;

        return {
            valid:
                reliablePoints.length >= MIN_RELIABLE_LANDMARKS &&
                averageConfidence >= MIN_LANDMARK_CONFIDENCE,

            confidence: averageConfidence,
            reliableCount: reliablePoints.length,
        };
    };

    /* ========================================================= */
    /* Handle MediaPipe Result */
    /* ========================================================= */

    const handleDetection = (detection) => {
        const landmarks = detection?.landmarks?.[0];
        const worldLandmarks = detection?.worldLandmarks?.[0];

        if (!landmarks || !worldLandmarks) {
            drawCanvas(null);

            publishInvalidPose(
                "No person detected. Move into the camera view.",
            );

            return;
        }

        drawCanvas(landmarks);

        if (!judgeRef.current) return;

        // Gate all scoring on reliable body landmarks.
        const confidence = validateLandmarks(landmarks);

        if (!confidence.valid) {
            publishInvalidPose(
                `Low pose confidence (${Math.round(
                    confidence.confidence * 100,
                )}%). Keep your body visible in the camera.`,
            );

            return;
        }

        /* ----------------------------------------------------- */
        /* Landmark → Joint Angles */
        /* ----------------------------------------------------- */

        const angles = PhysioGeometry.getStandardAngles(worldLandmarks);

        if (!angles) {
            publishInvalidPose(
                "Unable to calculate joint angles. Adjust your position.",
            );

            return;
        }

        /* ----------------------------------------------------- */
        /* ROM Judge */
        /* ----------------------------------------------------- */

        const judgeResult = judgeRef.current.processFrame(angles);

        if (!judgeResult) return;

        // Include confidence for debugging and UI if needed.
        judgeResult.poseConfidence = Math.round(confidence.confidence * 100);

        judgeResult.reliableLandmarks = confidence.reliableCount;

        /* ----------------------------------------------------- */
        /* Audio Feedback */
        /* ----------------------------------------------------- */

        if (judgeResult.feedback && feedbackRef.current) {
            feedbackRef.current.speak(judgeResult.feedback);
        }

        /* ----------------------------------------------------- */
        /* Update UI */
        /* ----------------------------------------------------- */

        setResult(judgeResult);
        onResult?.(judgeResult);
    };

    /* ========================================================= */
    /* Canvas Drawing */
    /* ========================================================= */

    const drawCanvas = (landmarks) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) return;

        const context = canvas.getContext("2d");

        if (!context) return;

        const width = video.videoWidth || VIDEO_WIDTH;
        const height = video.videoHeight || VIDEO_HEIGHT;

        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        context.clearRect(0, 0, width, height);

        if (!landmarks) return;

        drawPose(context, landmarks, width, height);
    };

    /* ========================================================= */
    /* Skeleton Drawing */
    /* ========================================================= */

    const drawPose = (context, landmarks, width, height) => {
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
        ];

        context.lineWidth = 4;
        context.lineCap = "round";
        context.lineJoin = "round";

        for (const [startIndex, endIndex] of connections) {
            const start = landmarks[startIndex];
            const end = landmarks[endIndex];

            if (!start || !end) continue;

            if (
                getLandmarkVisibility(start) < 0.3 ||
                getLandmarkVisibility(end) < 0.3
            ) {
                continue;
            }

            context.beginPath();
            context.moveTo(start.x * width, start.y * height);
            context.lineTo(end.x * width, end.y * height);
            context.stroke();
        }

        for (const landmark of landmarks) {
            if (!landmark || getLandmarkVisibility(landmark) < 0.3) {
                continue;
            }

            context.beginPath();
            context.arc(
                landmark.x * width,
                landmark.y * height,
                5,
                0,
                Math.PI * 2,
            );
            context.fill();
        }
    };

    /* ========================================================= */
    /* Stop Tracking */
    /* ========================================================= */

    const stopTracking = () => {
        if (stoppedRef.current) return;

        stoppedRef.current = true;
        runningRef.current = false;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        if (poseLandmarkerRef.current) {
            poseLandmarkerRef.current.close();
            poseLandmarkerRef.current = null;
        }

        feedbackRef.current?.reset();

        setCameraReady(false);
        onStop?.();
    };

    /* ========================================================= */
    /* Reset Exercise */
    /* ========================================================= */

    const resetExercise = () => {
        judgeRef.current?.reset();
        feedbackRef.current?.reset();

        lastVideoTimeRef.current = -1;
        setResult(null);
    };

    /* ========================================================= */
    /* Render */
    /* ========================================================= */

    return (
        <div className="w-full space-y-4">
            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
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
                            Pose tracking error
                        </p>
                        <p className="mt-0.5 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Camera */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg">
                <div className="relative aspect-video w-full overflow-hidden">
                    <video
                        ref={videoRef}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        playsInline
                    />

                    <canvas
                        ref={canvasRef}
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    />

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-700 border-t-blue-500">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                            </div>

                            <p className="mt-4 text-sm font-medium text-white">
                                Initializing pose tracking...
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Loading the movement analysis engine
                            </p>
                        </div>
                    )}

                    {!cameraReady && !isLoading && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur">
                                Starting camera...
                            </div>
                        </div>
                    )}

                    {cameraReady && !isLoading && (
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            Live
                        </div>
                    )}

                    {exercise?.name && (
                        <div className="absolute right-4 top-4 max-w-[60%] rounded-lg bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                            {exercise.name}
                        </div>
                    )}

                    {result?.feedback && (
                        <div className="absolute bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
                            <div className="rounded-xl border border-white/10 bg-slate-950/80 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg backdrop-blur">
                                {result.feedback}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Live Stats */}
            {result && (
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <LiveStat label="Phase" value={formatPhase(result.phase)} />

                    <LiveStat label="Reps" value={result.reps ?? 0} />

                    <LiveStat
                        label="Progress"
                        value={`${Math.round(result.progress ?? 0)}%`}
                    />

                    <LiveStat
                        label="Score"
                        value={
                            result.score == null
                                ? "—"
                                : Math.round(result.score)
                        }
                        score
                    />
                </section>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        Exercise controls
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Reset your movement analysis or stop the camera.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={resetExercise}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Reset
                    </button>

                    <button
                        type="button"
                        onClick={stopTracking}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Stop Camera
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================= */
/* Live Stat */
/* ============================================================= */

function LiveStat({ label, value, score = false }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p
                className={`mt-2 truncate text-xl font-semibold ${
                    score ? getScoreTextClass(value) : "text-slate-900"
                }`}
            >
                {value}
            </p>
        </div>
    );
}

/* ============================================================= */
/* Helpers */
/* ============================================================= */

function formatPhase(phase) {
    if (!phase) return "RESTING";

    return String(phase)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getScoreTextClass(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) return "text-slate-400";
    if (value >= 85) return "text-emerald-600";
    if (value >= 70) return "text-blue-600";
    if (value >= 50) return "text-amber-600";

    return "text-red-600";
}

export default PoseTracker;
