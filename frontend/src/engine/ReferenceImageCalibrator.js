import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { extractStaticPoseFeatures } from "./staticPoseFeatures";

const TASKS_VISION_VERSION = "0.10.14";

const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export default class ReferenceImageCalibrator {
    constructor() {
        this.landmarker = null;
        this.vision = null;
    }

    async initialize() {
        if (this.landmarker) {
            return this.landmarker;
        }

        this.vision = await FilesetResolver.forVisionTasks(WASM_URL);

        const commonOptions = {
            runningMode: "IMAGE",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
        };

        try {
            this.landmarker = await PoseLandmarker.createFromOptions(
                this.vision,
                {
                    ...commonOptions,
                    baseOptions: {
                        modelAssetPath: MODEL_URL,
                        delegate: "GPU",
                    },
                },
            );
        } catch (gpuError) {
            console.warn(
                "GPU initialization failed. Falling back to CPU.",
                gpuError,
            );

            this.landmarker = await PoseLandmarker.createFromOptions(
                this.vision,
                {
                    ...commonOptions,
                    baseOptions: {
                        modelAssetPath: MODEL_URL,
                        delegate: "CPU",
                    },
                },
            );
        }

        return this.landmarker;
    }

    async calibrate(imageFile) {
        if (!imageFile) {
            throw new Error("Choose a reference image first.");
        }

        if (imageFile.type && !imageFile.type.startsWith("image/")) {
            throw new Error("The selected file is not an image.");
        }

        await this.initialize();

        let bitmap;

        try {
            bitmap = await createImageBitmap(imageFile);

            const detection = this.landmarker.detect(bitmap);

            const normalizedLandmarks = detection?.landmarks?.[0];
            const worldLandmarks = detection?.worldLandmarks?.[0];

            if (
                !Array.isArray(normalizedLandmarks) ||
                !Array.isArray(worldLandmarks)
            ) {
                throw new Error(
                    "No person detected. Choose a clear image with the relevant body joints visible.",
                );
            }

            const features = extractStaticPoseFeatures(
                worldLandmarks,
                normalizedLandmarks,
            );

            if (features.angles.length < 4) {
                throw new Error(
                    "Too few joints could be measured. Use a clearer image showing the arms, hips, and legs.",
                );
            }

            if (features.visibleLandmarks < 15) {
                throw new Error(
                    "Too few landmarks are visible. Use a clear, full-body reference image.",
                );
            }

            if (
                !Array.isArray(features.relativeLandmarks) ||
                features.relativeLandmarks.length !== normalizedLandmarks.length
            ) {
                throw new Error(
                    "Could not normalize the body landmarks. Make sure both shoulders and both hips are visible.",
                );
            }

            const usableLandmarks = features.relativeLandmarks.filter(
                (point) =>
                    point &&
                    Number.isFinite(point.x) &&
                    Number.isFinite(point.y) &&
                    Number.isFinite(point.z),
            ).length;

            if (usableLandmarks < 10) {
                throw new Error(
                    "Not enough reliable landmarks were extracted. Try a clearer image with less body occlusion.",
                );
            }

            return {
                version: 2,
                angles: features.angles.map(({ name, value, confidence }) => ({
                    name,
                    value,
                    confidence,
                })),
                relativeLandmarks: features.relativeLandmarks,
                usableLandmarks,
                totalLandmarks: normalizedLandmarks.length,
                calibratedAt: new Date().toISOString(),
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error(
                "Reference image calibration failed. Please try another image.",
            );
        } finally {
            if (bitmap) {
                bitmap.close?.();
            }
        }
    }

    close() {
        if (this.landmarker) {
            this.landmarker.close();
            this.landmarker = null;
        }

        this.vision = null;
    }
}
