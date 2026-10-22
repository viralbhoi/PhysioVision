const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers = {
        ...(options.headers || {}),
    };

    // FormData must set its own multipart Content-Type boundary.
    if (isFormData) {
        delete headers["Content-Type"];
        delete headers["content-type"];
    } else if (options.body !== undefined) {
        headers["Content-Type"] =
            headers["Content-Type"] ||
            headers["content-type"] ||
            "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
};

export const getMyAssignments = () => apiRequest("/assignments/my");

export const startSession = (assignmentId) =>
    apiRequest("/sessions/start", {
        method: "POST",
        body: JSON.stringify({ assignmentId }),
    });

export const completeSession = (sessionId, sessionData) =>
    apiRequest(`/sessions/${sessionId}/complete`, {
        method: "PATCH",
        body: JSON.stringify(sessionData),
    });

export const getMySessions = () => apiRequest("/sessions/my");

export const getPhysioPatients = () => apiRequest("/physio/patients");

export const getExercises = () => apiRequest("/exercises");

export const assignExercise = (assignmentData) =>
    apiRequest("/assignments", {
        method: "POST",
        body: JSON.stringify(assignmentData),
    });

export const getPatientProgress = (patientId) =>
    apiRequest(`/progress/patient/${patientId}`);

export const getPatientSessions = (patientId) =>
    apiRequest(`/progress/patient/${patientId}/sessions`);

// Supports both existing JSON exercise creation and multipart file uploads.
export const createExercise = (exerciseData) =>
    apiRequest("/exercises", {
        method: "POST",
        body:
            typeof FormData !== "undefined" && exerciseData instanceof FormData
                ? exerciseData
                : JSON.stringify(exerciseData),
    });

export const generateConnectionCode = () =>
    apiRequest("/connections/code", {
        method: "POST",
    });

export const connectToPhysiotherapist = (code) =>
    apiRequest("/connections/connect", {
        method: "POST",
        body: JSON.stringify({ code }),
    });

export const getMyPhysiotherapist = () => apiRequest("/connections/mine");

export const registerUser = (userData) =>
    apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
