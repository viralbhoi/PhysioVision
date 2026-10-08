import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

import PhysioGeometry from "../engine/geometry";
import ROMJudge from "../engine/ROMJudge";
import FeedbackEngine from "../engine/FeedbackEngine";

import "./PoseTracker.css";

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

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

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [result, setResult] = useState(null);

    // =========================================================
    // Initialize ROM Judge
    // =========================================================

    useEffect(() => {
        if (!exercise) {
            judgeRef.current = null;
            return;
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

    // =========================================================
    // Initialize MediaPipe
    // =========================================================

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

                if (onReady) {
                    onReady();
                }

                await startCamera();
            } catch (err) {
                console.error("PoseLandmarker initialization failed:", err);

                if (!mounted) {
                    return;
                }

                setError(err.message || "Unable to initialize pose tracking.");

                setIsLoading(false);
            }
        };

        initializePoseLandmarker();

        return () => {
            mounted = false;

            stopTracking();
        };
    }, []);

    // =========================================================
    // Start Camera
    // =========================================================

    const startCamera = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera access is not supported by this browser.",
                );
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {
                        ideal: VIDEO_WIDTH,
                    },
                    height: {
                        ideal: VIDEO_HEIGHT,
                    },
                    facingMode: "user",
                },
                audio: false,
            });

            streamRef.current = stream;

            const video = videoRef.current;

            if (!video) {
                return;
            }

            video.srcObject = stream;

            video.setAttribute("playsinline", "");

            await video.play();

            setCameraReady(true);

            runningRef.current = true;

            processVideoFrame();
        } catch (err) {
            console.error("Camera initialization failed:", err);

            setError(err.message || "Unable to access camera.");
        }
    };

    // =========================================================
    // Main Video Loop
    // =========================================================

    const processVideoFrame = () => {
        if (!runningRef.current) {
            return;
        }

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

        /*
         * MediaPipe requires an increasing
         * timestamp for VIDEO mode.
         */
        const currentTime = video.currentTime;

        if (currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;

            const timestamp = performance.now();

            try {
                const detection = poseLandmarker.detectForVideo(
                    video,
                    timestamp,
                );

                handleDetection(detection);
            } catch (err) {
                console.error("Pose detection failed:", err);
            }
        }

        animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    };

    // =========================================================
    // Handle MediaPipe Result
    // =========================================================

    const handleDetection = (detection) => {
        if (!detection || !detection.landmarks?.length) {
            drawCanvas(null);

            return;
        }

        const landmarks = detection.landmarks[0];

        const worldLandmarks = detection.worldLandmarks?.[0];

        /*
         * World landmarks are required
         * for biomechanical calculations.
         *
         * 2D landmarks are only used
         * for visualization.
         */
        if (!worldLandmarks) {
            drawCanvas(landmarks);

            return;
        }

        drawCanvas(landmarks);

        if (!judgeRef.current) {
            return;
        }

        // =====================================================
        // Landmark → Joint Angles
        // =====================================================

        const angles = PhysioGeometry.getStandardAngles(worldLandmarks);

        if (!angles) {
            return;
        }

        // =====================================================
        // ROM Judge
        // =====================================================

        const judgeResult = judgeRef.current.processFrame(angles);

        if (!judgeResult) {
            return;
        }

        // =====================================================
        // Audio Feedback
        // =====================================================

        if (judgeResult.feedback && feedbackRef.current) {
            feedbackRef.current.speak(judgeResult.feedback);
        }

        // =====================================================
        // Update UI
        // =====================================================

        setResult(judgeResult);

        // =====================================================
        // Send result to parent
        // =====================================================

        if (onResult) {
            onResult(judgeResult);
        }
    };

    // =========================================================
    // Canvas Drawing
    // =========================================================

    const drawCanvas = (landmarks) => {
        const canvas = canvasRef.current;

        const video = videoRef.current;

        if (!canvas || !video) {
            return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        const width = video.videoWidth || VIDEO_WIDTH;

        const height = video.videoHeight || VIDEO_HEIGHT;

        canvas.width = width;
        canvas.height = height;

        context.clearRect(0, 0, width, height);

        if (!landmarks) {
            return;
        }

        drawPose(context, landmarks, width, height);
    };

    // =========================================================
    // Skeleton Drawing
    // =========================================================

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

        for (const [startIndex, endIndex] of connections) {
            const start = landmarks[startIndex];

            const end = landmarks[endIndex];

            if (!start || !end) {
                continue;
            }

            if ((start.visibility ?? 1) < 0.3 || (end.visibility ?? 1) < 0.3) {
                continue;
            }

            context.beginPath();

            context.moveTo(start.x * width, start.y * height);

            context.lineTo(end.x * width, end.y * height);

            context.stroke();
        }

        for (const landmark of landmarks) {
            if (!landmark || (landmark.visibility ?? 1) < 0.3) {
                continue;
            }

            const x = landmark.x * width;

            const y = landmark.y * height;

            context.beginPath();

            context.arc(x, y, 5, 0, Math.PI * 2);

            context.fill();
        }
    };

    // =========================================================
    // Stop Tracking
    // =========================================================

    const stopTracking = () => {
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

        if (onStop) {
            onStop();
        }
    };

    // =========================================================
    // Reset Exercise
    // =========================================================

    const resetExercise = () => {
        judgeRef.current?.reset();

        feedbackRef.current?.reset();

        setResult(null);

        lastVideoTimeRef.current = -1;
    };

    // =========================================================
    // Render
    // =========================================================

    return (
        <div className="pose-tracker">
            {error && <div className="pose-error">{error}</div>}

            {isLoading && (
                <div className="pose-loading">
                    Initializing pose tracking...
                </div>
            )}

            <div className="pose-video-container">
                <video
                    ref={videoRef}
                    className="pose-video"
                    autoPlay
                    muted
                    playsInline
                />

                <canvas ref={canvasRef} className="pose-canvas" />

                {!cameraReady && !isLoading && !error && (
                    <div className="pose-overlay">Starting camera...</div>
                )}
            </div>

            {result && (
                <div className="pose-stats">
                    <div className="pose-stat">
                        <span>Phase</span>

                        <strong>{result.phase || "RESTING"}</strong>
                    </div>

                    <div className="pose-stat">
                        <span>Reps</span>

                        <strong>{result.reps ?? 0}</strong>
                    </div>

                    <div className="pose-stat">
                        <span>Progress</span>

                        <strong>{Math.round(result.progress ?? 0)}%</strong>
                    </div>

                    <div className="pose-stat">
                        <span>Score</span>

                        <strong>{Math.round(result.score ?? 0)}</strong>
                    </div>
                </div>
            )}

            {result?.feedback && (
                <div className="pose-feedback">{result.feedback}</div>
            )}

            <div className="pose-controls">
                <button type="button" onClick={resetExercise}>
                    Reset
                </button>

                <button type="button" onClick={stopTracking}>
                    Stop Camera
                </button>
            </div>
        </div>
    );
}

export default PoseTracker;
