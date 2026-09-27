import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

import PhysioGeometry from "../engine/geometry.js";
import ROMJudge from "../engine/ROMJudge.js";

const PoseTracker = ({ exercise }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const poseLandmarkerRef = useRef(null);
    const animationRef = useRef(null);

    const judgeRef = useRef(null);

    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState("");

    const [result, setResult] = useState({
        reps: 0,
        state: "CALIBRATING",
        progress: 0,
        lastScore: 0,
        avgScore: 0,
        repScores: [],
        feedback: "Get in starting position...",
        ttsFeedback: "",
        frameAccuracy: 0,
        planeValid: true,
    });

    // =========================================================
    // Create ROM Judge whenever exercise changes
    // =========================================================

    useEffect(() => {
        if (!exercise) {
            judgeRef.current = null;
            return;
        }

        const configuration = exercise.configuration || exercise;

        judgeRef.current = new ROMJudge(configuration);

        setResult({
            reps: 0,
            state: "CALIBRATING",
            progress: 0,
            lastScore: 0,
            avgScore: 0,
            repScores: [],
            feedback: "Get in starting position...",
            ttsFeedback: "",
            frameAccuracy: 0,
            planeValid: true,
        });
    }, [exercise]);

    // =========================================================
    // Initialize MediaPipe
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const initializePose = async () => {
            try {
                setError("");

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
                );

                const poseLandmarker = await PoseLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                        },

                        runningMode: "VIDEO",

                        numPoses: 1,

                        minPoseDetectionConfidence: 0.6,
                        minPosePresenceConfidence: 0.6,
                        minTrackingConfidence: 0.6,
                    },
                );

                if (cancelled) {
                    poseLandmarker.close();
                    return;
                }

                poseLandmarkerRef.current = poseLandmarker;

                // ---------------------------------------------
                // Camera
                // ---------------------------------------------

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 1280,
                        height: 720,
                        facingMode: "user",
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());

                    poseLandmarker.close();
                    return;
                }

                const video = videoRef.current;

                video.srcObject = stream;

                await video.play();

                setIsReady(true);

                detectPose();
            } catch (err) {
                console.error(err);

                setError("Unable to initialize camera or pose tracking.");
            }
        };

        initializePose();

        // =====================================================
        // Cleanup
        // =====================================================

        return () => {
            cancelled = true;

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject
                    .getTracks()
                    .forEach((track) => track.stop());

                videoRef.current.srcObject = null;
            }

            if (poseLandmarkerRef.current) {
                poseLandmarkerRef.current.close();
                poseLandmarkerRef.current = null;
            }
        };
    }, []);

    // =========================================================
    // Pose processing loop
    // =========================================================

    const detectPose = () => {
        const video = videoRef.current;

        const canvas = canvasRef.current;

        const poseLandmarker = poseLandmarkerRef.current;

        if (
            !video ||
            !canvas ||
            !poseLandmarker ||
            video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            animationRef.current = requestAnimationFrame(detectPose);

            return;
        }

        const ctx = canvas.getContext("2d");

        // Match canvas to actual video
        if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
        ) {
            canvas.width = video.videoWidth;

            canvas.height = video.videoHeight;
        }

        // =====================================================
        // MediaPipe detection
        // =====================================================

        const timestamp = performance.now();

        const detection = poseLandmarker.detectForVideo(video, timestamp);

        // =====================================================
        // Draw video skeleton
        // =====================================================

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection.landmarks && detection.landmarks.length > 0) {
            const landmarks = detection.landmarks[0];

            drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
        }

        // =====================================================
        // REAL-TIME ENGINE
        // =====================================================

        if (
            detection.worldLandmarks &&
            detection.worldLandmarks.length > 0 &&
            judgeRef.current
        ) {
            const worldLandmarks = detection.worldLandmarks[0];

            // ---------------------------------------------
            // 1. Calculate biomechanical angles
            // ---------------------------------------------

            const angles = PhysioGeometry.getStandardAngles(worldLandmarks);

            // ---------------------------------------------
            // 2. ROM Judge
            // ---------------------------------------------

            const judgeResult = judgeRef.current.processFrame(angles);

            setResult(judgeResult);
        }

        animationRef.current = requestAnimationFrame(detectPose);
    };

    // =========================================================
    // Skeleton drawing
    // =========================================================

    const drawSkeleton = (ctx, landmarks, width, height) => {
        const connections = [
            [11, 13],
            [13, 15],

            [12, 14],
            [14, 16],

            [11, 12],

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

        ctx.lineWidth = 3;

        // ---------------------------------------------
        // Connections
        // ---------------------------------------------

        connections.forEach(([startIndex, endIndex]) => {
            const start = landmarks[startIndex];

            const end = landmarks[endIndex];

            if (!start || !end) {
                return;
            }

            if ((start.visibility ?? 1) < 0.4 || (end.visibility ?? 1) < 0.4) {
                return;
            }

            ctx.beginPath();

            ctx.moveTo(start.x * width, start.y * height);

            ctx.lineTo(end.x * width, end.y * height);

            ctx.stroke();
        });

        // ---------------------------------------------
        // Landmark points
        // ---------------------------------------------

        landmarks.forEach((landmark) => {
            if ((landmark.visibility ?? 1) < 0.4) {
                return;
            }

            ctx.beginPath();

            ctx.arc(landmark.x * width, landmark.y * height, 4, 0, Math.PI * 2);

            ctx.fill();
        });
    };

    // =========================================================
    // Render
    // =========================================================

    return (
        <div className="pose-tracker">
            <div className="camera-container">
                <video ref={videoRef} autoPlay muted playsInline />

                <canvas ref={canvasRef} />
            </div>

            {error && <div className="tracker-error">{error}</div>}

            {!isReady && !error && (
                <div className="tracker-loading">Initializing camera...</div>
            )}

            {isReady && (
                <div className="exercise-stats">
                    <div className="stat">
                        <span>Reps</span>
                        <strong>{result.reps}</strong>
                    </div>

                    <div className="stat">
                        <span>Progress</span>
                        <strong>{result.progress}%</strong>
                    </div>

                    <div className="stat">
                        <span>Score</span>
                        <strong>{result.avgScore}</strong>
                    </div>

                    <div className="stat">
                        <span>Phase</span>
                        <strong>{result.state}</strong>
                    </div>
                </div>
            )}

            {isReady && <div className="feedback">{result.feedback}</div>}
        </div>
    );
};

export default PoseTracker;
