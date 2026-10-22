import multer from "multer";

const allowedMimeTypes = {
    image: ["image/jpeg", "image/png", "image/webp"],
    video: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
};

const uploadExerciseAssets = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 2,
    },

    fileFilter: (req, file, callback) => {
        const isImage =
            file.fieldname === "referenceImage" &&
            allowedMimeTypes.image.includes(file.mimetype);

        const isVideo =
            file.fieldname === "referenceVideo" &&
            allowedMimeTypes.video.includes(file.mimetype);

        if (!isImage && !isVideo) {
            return callback(
                new Error(
                    "Unsupported file type. Upload a supported image or video.",
                ),
            );
        }

        callback(null, true);
    },
});

export default uploadExerciseAssets;
