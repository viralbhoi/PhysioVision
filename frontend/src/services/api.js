const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

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
        body: JSON.stringify({
            assignmentId,
        }),
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

export const createExercise = (exerciseData) =>
    apiRequest("/exercises", {
        method: "POST",
        body: JSON.stringify(exerciseData),
    });