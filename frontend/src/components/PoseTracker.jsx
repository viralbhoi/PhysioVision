import { useEffect, useRef } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const CONNECTIONS = [
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

function PoseTracker() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const poseLandmarkerRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        let stream;

        const initialize = async () => {
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
                },
            );

            poseLandmarkerRef.current = poseLandmarker;

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: "user",
                },
                audio: false,
            });

            const video = videoRef.current;

            video.srcObject = stream;

            await video.play();

            detectPose();
        };

        const detectPose = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas || !poseLandmarkerRef.current) {
                animationRef.current = requestAnimationFrame(detectPose);
                return;
            }

            if (video.readyState < 2) {
                animationRef.current = requestAnimationFrame(detectPose);
                return;
            }

            const ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const result = poseLandmarkerRef.current.detectForVideo(
                video,
                performance.now(),
            );

            if (result.landmarks?.length > 0) {
                const landmarks = result.landmarks[0];

                drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
            }

            animationRef.current = requestAnimationFrame(detectPose);
        };

        initialize();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            if (poseLandmarkerRef.current) {
                poseLandmarkerRef.current.close();
            }
        };
    }, []);

    return (
        <div className="pose-container">
            <video ref={videoRef} className="camera" playsInline muted />

            <canvas ref={canvasRef} className="skeleton" />
        </div>
    );
}

function drawSkeleton(ctx, landmarks, width, height) {
    ctx.lineWidth = 4;

    for (const [start, end] of CONNECTIONS) {
        const a = landmarks[start];
        const b = landmarks[end];

        if (!a || !b) continue;

        if (
            a.visibility !== undefined &&
            (a.visibility < 0.5 || b.visibility < 0.5)
        ) {
            continue;
        }

        const x1 = a.x * width;
        const y1 = a.y * height;

        const x2 = b.x * width;
        const y2 = b.y * height;

        ctx.beginPath();

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.stroke();
    }

    for (const point of landmarks) {
        if (point.visibility !== undefined && point.visibility < 0.5) {
            continue;
        }

        const x = point.x * width;
        const y = point.y * height;

        ctx.beginPath();

        ctx.arc(x, y, 5, 0, Math.PI * 2);

        ctx.fill();
    }
}

export default PoseTracker;
