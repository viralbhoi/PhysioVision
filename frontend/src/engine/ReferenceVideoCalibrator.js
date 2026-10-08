import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import Calibrator from "./Calibrator.js";

class ReferenceVideoCalibrator {
    constructor({ onProgress, onFrame, onComplete, onError } = {}) {
        this.onProgress = onProgress;
        this.onFrame = onFrame;
        this.onComplete = onComplete;
        this.onError = onError;

        this.poseLandmarker = null;
        this.video = null;

        this.calibrator = new Calibrator();

        this.cancelled = false;

        this.processedFrames = 0;
        this.validFrames = 0;
        this.totalFrames = 0;

        this.sampleRate = 5;
    }

    // =========================================================
    // Initialize MediaPipe
    // =========================================================

    async initialize() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            },

            runningMode: "VIDEO",

            numPoses: 1,

            minPoseDetectionConfidence: 0.6,
            minPosePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
        });
    }

    // =========================================================
    // Load video
    // =========================================================

    async loadVideo(file) {
        if (!file) {
            throw new Error("Reference video is required.");
        }

        if (!file.type.startsWith("video/")) {
            throw new Error("Please select a valid video file.");
        }

        const url = URL.createObjectURL(file);

        const video = document.createElement("video");

        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;

            video.onerror = () =>
                reject(new Error("Unable to load reference video."));
        });

        this.video = video;

        this.totalFrames = Math.floor(video.duration * 30);

        return {
            duration: video.duration,

            width: video.videoWidth,

            height: video.videoHeight,
        };
    }

    // =========================================================
    // Start calibration
    // =========================================================

    async calibrate(file) {
        try {
            this.cancelled = false;

            this.processedFrames = 0;
            this.validFrames = 0;

            this.calibrator.reset();

            if (!this.poseLandmarker) {
                await this.initialize();
            }

            const videoInfo = await this.loadVideo(file);

            const estimatedFPS =
                this.totalFrames / Math.max(videoInfo.duration, 0.001);

            const frameInterval = 1 / Math.max(estimatedFPS, 1);

            let currentTime = 0;

            while (currentTime < videoInfo.duration && !this.cancelled) {
                await this.seekVideo(currentTime);

                await this.processCurrentFrame(currentTime);

                currentTime += frameInterval * this.sampleRate;

                const progress = Math.min(
                    100,
                    (currentTime / videoInfo.duration) * 100,
                );

                this.onProgress?.({
                    progress,
                    processedFrames: this.processedFrames,
                    validFrames: this.validFrames,
                });

                // Give the browser a chance
                // to render UI and avoid
                // blocking the main thread
                await this.yieldToBrowser();
            }

            if (this.cancelled) {
                return null;
            }

            if (this.validFrames < 10) {
                throw new Error(
                    "Not enough valid pose frames. Please use a clearer reference video.",
                );
            }

            const configuration = this.calibrator.calibrate();

            const result = {
                ...configuration,

                video: {
                    duration: videoInfo.duration,

                    width: videoInfo.width,

                    height: videoInfo.height,
                },

                processedFrames: this.processedFrames,

                validFrames: this.validFrames,
            };

            this.onComplete?.(result);

            return result;
        } catch (error) {
            this.onError?.(error);
            throw error;
        }
    }

    // =========================================================
    // Seek video
    // =========================================================

    seekVideo(time) {
        return new Promise((resolve, reject) => {
            const video = this.video;

            if (!video) {
                reject(new Error("Video is not loaded."));

                return;
            }

            const target = Math.min(time, video.duration);

            if (Math.abs(video.currentTime - target) < 0.001) {
                resolve();
                return;
            }

            const handleSeek = () => {
                cleanup();
                resolve();
            };

            const handleError = () => {
                cleanup();

                reject(new Error("Video seek failed."));
            };

            const cleanup = () => {
                video.removeEventListener("seeked", handleSeek);

                video.removeEventListener("error", handleError);
            };

            video.addEventListener("seeked", handleSeek, {
                once: true,
            });

            video.addEventListener("error", handleError, {
                once: true,
            });

            video.currentTime = target;
        });
    }

    // =========================================================
    // Process current frame
    // =========================================================

    async processCurrentFrame(timestamp) {
        if (!this.poseLandmarker || !this.video) {
            return;
        }

        const result = this.poseLandmarker.detectForVideo(
            this.video,
            timestamp * 1000,
        );

        this.processedFrames++;

        if (!result.worldLandmarks || result.worldLandmarks.length === 0) {
            return;
        }

        const worldLandmarks = result.worldLandmarks[0];

        const added = this.calibrator.addFrame(worldLandmarks);

        if (added) {
            this.validFrames++;

            this.onFrame?.({
                landmarks: worldLandmarks,

                valid: true,

                validFrames: this.validFrames,
            });
        } else {
            this.onFrame?.({
                landmarks: worldLandmarks,

                valid: false,

                validFrames: this.validFrames,
            });
        }
    }

    // =========================================================
    // Cancel
    // =========================================================

    cancel() {
        this.cancelled = true;
    }

    // =========================================================
    // Cleanup
    // =========================================================

    dispose() {
        this.cancelled = true;

        if (this.poseLandmarker) {
            this.poseLandmarker.close();

            this.poseLandmarker = null;
        }

        if (this.video) {
            const source = this.video.src;

            this.video.pause();

            this.video.removeAttribute("src");

            this.video.load();

            if (source) {
                URL.revokeObjectURL(source);
            }

            this.video = null;
        }
    }

    // =========================================================
    // Yield
    // =========================================================

    yieldToBrowser() {
        return new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
    }
}

export default ReferenceVideoCalibrator;
