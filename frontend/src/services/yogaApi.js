const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function createYogaExercise({
    name,
    description,
    trackingMode,
    imageFile,
    videoFile,
    targetHoldSeconds,
    matchThreshold,
    configuration,
}) {
    const token = localStorage.getItem("token");

    const body = new FormData();

    body.append("name", name);
    body.append("description", description);
    body.append("category", "YOGA");
    body.append("trackingMode", trackingMode);
    body.append("configuration", JSON.stringify(configuration || {}));
    body.append("matchThreshold", String(matchThreshold ?? 75));

    if (trackingMode === "STATIC") {
        if (!imageFile) {
            throw new Error("Reference image is required.");
        }

        body.append("referenceImage", imageFile);
        body.append("targetHoldSeconds", String(targetHoldSeconds));
    } else {
        if (!videoFile) {
            throw new Error("Reference video is required.");
        }

        body.append("referenceVideo", videoFile);
    }

    const response = await fetch(`${API_BASE_URL}/exercises`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Unable to create yoga exercise.");
    }

    return data;
}
