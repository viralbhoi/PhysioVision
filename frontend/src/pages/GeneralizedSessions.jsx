import { useCallback, useEffect, useState } from "react";
import { getExercises } from "../services/api";

const API_BASE = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt")
    );
}

async function request(endpoint, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

const styles = {
    page: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "28px 20px",
        color: "#292524",
    },
    card: {
        background: "#fff",
        border: "1px solid #e7e5e4",
        borderRadius: 16,
        padding: 24,
        marginBottom: 22,
        boxShadow: "0 4px 18px rgba(0,0,0,0.035)",
    },
    label: {
        display: "block",
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 7,
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #d6d3d1",
        borderRadius: 9,
        padding: "11px 12px",
        fontSize: 14,
        background: "#fff",
        color: "#292524",
    },
    primary: {
        background: "#6b3e26",
        color: "#fff",
        border: 0,
        borderRadius: 9,
        padding: "11px 17px",
        fontWeight: 600,
        cursor: "pointer",
    },
    secondary: {
        background: "#f5f1ed",
        color: "#6b3e26",
        border: "1px solid #e7d8cc",
        borderRadius: 9,
        padding: "9px 12px",
        fontWeight: 600,
        cursor: "pointer",
    },
};

function getExerciseId(exercise) {
    return exercise?._id || exercise?.id;
}

function getExerciseName(exercise) {
    return (
        exercise?.name ||
        exercise?.title ||
        exercise?.exerciseName ||
        "Untitled exercise"
    );
}

function getExercisesFromResponse(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.exercises)) return response.exercises;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.exercises)) {
        return response.data.exercises;
    }
    return [];
}

export default function GeneralizedSessions() {
    const [exercises, setExercises] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [password, setPassword] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [exerciseResult, sessionResult] = await Promise.all([
                getExercises(),
                request("/generalized-sessions/mine"),
            ]);

            setExercises(getExercisesFromResponse(exerciseResult));
            setSessions(sessionResult.sessions || []);
        } catch (err) {
            setError(err.message || "Unable to load sessions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function toggleExercise(id) {
        setSelectedExercises((previous) =>
            previous.includes(id)
                ? previous.filter((item) => item !== id)
                : [...previous, id],
        );
    }

    async function handleCreate(event) {
        event.preventDefault();
        setError("");
        setNotice("");

        if (!title.trim()) {
            setError("Enter a session title.");
            return;
        }

        if (selectedExercises.length === 0) {
            setError("Select at least one exercise.");
            return;
        }

        if (password.length < 4) {
            setError("Use a session password with at least 4 characters.");
            return;
        }

        setCreating(true);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                exercises: selectedExercises,
                password,
                ...(expiresAt
                    ? { expiresAt: new Date(expiresAt).toISOString() }
                    : {}),
            };

            const result = await request("/generalized-sessions", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const createdSession = result.session;
            const inviteLink =
                result.inviteLink ||
                `${window.location.origin}/join-session/${createdSession.inviteCode}`;

            setTitle("");
            setDescription("");
            setPassword("");
            setExpiresAt("");
            setSelectedExercises([]);

            await loadData();

            setNotice(
                `Session created successfully. Invite link: ${inviteLink}`,
            );
        } catch (err) {
            setError(err.message || "Unable to create session.");
        } finally {
            setCreating(false);
        }
    }

    async function copyInviteLink(session) {
        const link = `${window.location.origin}/join-session/${session.inviteCode}`;

        try {
            await navigator.clipboard.writeText(link);
            setNotice(`Invite link copied: ${link}`);
            setError("");
        } catch {
            window.prompt("Copy this invite link:", link);
        }
    }

    async function toggleStatus(session) {
        setError("");
        setNotice("");

        try {
            await request(`/generalized-sessions/${session._id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ isActive: !session.isActive }),
            });

            setNotice(
                session.isActive ? "Session closed." : "Session reopened.",
            );

            await loadData();
        } catch (err) {
            setError(err.message || "Unable to update session.");
        }
    }

    return (
        <main style={styles.page}>
            <header style={{ marginBottom: 26 }}>
                <p
                    style={{
                        color: "#8b5e3c",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                    }}
                >
                    PhysioVision · Live sessions
                </p>

                <h1 style={{ fontSize: 30, margin: "8px 0" }}>
                    Generalized Sessions
                </h1>

                <p style={{ color: "#78716c", lineHeight: 1.6 }}>
                    Create a shared exercise session and invite participants
                    with a link and password. Participants do not need an
                    existing patient–physiotherapist assignment.
                </p>
            </header>

            {error && (
                <div
                    role="alert"
                    style={{
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: 9,
                        padding: 13,
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    style={{
                        background: "#f0fdf4",
                        color: "#166534",
                        borderRadius: 9,
                        padding: 13,
                        marginBottom: 16,
                        overflowWrap: "anywhere",
                    }}
                >
                    {notice}
                </div>
            )}

            <section style={styles.card}>
                <h2 style={{ fontSize: 21, marginTop: 0 }}>Create a session</h2>

                <form onSubmit={handleCreate}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={styles.label} htmlFor="session-title">
                            Session title
                        </label>
                        <input
                            id="session-title"
                            style={styles.input}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="e.g. Morning mobility session"
                            maxLength={120}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label
                            style={styles.label}
                            htmlFor="session-description"
                        >
                            Description (optional)
                        </label>
                        <textarea
                            id="session-description"
                            style={{
                                ...styles.input,
                                minHeight: 90,
                                resize: "vertical",
                            }}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Instructions or details for participants"
                            maxLength={1000}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={styles.label}>
                            Select exercises ({selectedExercises.length}{" "}
                            selected)
                        </label>

                        <div
                            style={{
                                border: "1px solid #e7e5e4",
                                borderRadius: 10,
                                maxHeight: 260,
                                overflowY: "auto",
                            }}
                        >
                            {loading ? (
                                <p style={{ padding: 14 }}>
                                    Loading exercises…
                                </p>
                            ) : exercises.length === 0 ? (
                                <p style={{ padding: 14, color: "#78716c" }}>
                                    No exercises were returned by your exercise
                                    API.
                                </p>
                            ) : (
                                exercises.map((exercise) => {
                                    const id = getExerciseId(exercise);

                                    if (!id) return null;

                                    return (
                                        <label
                                            key={id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 11,
                                                padding: "12px 14px",
                                                borderBottom:
                                                    "1px solid #f5f5f4",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedExercises.includes(
                                                    id,
                                                )}
                                                onChange={() =>
                                                    toggleExercise(id)
                                                }
                                            />
                                            <span>
                                                {getExerciseName(exercise)}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 16,
                            marginBottom: 20,
                        }}
                    >
                        <div>
                            <label
                                style={styles.label}
                                htmlFor="session-password"
                            >
                                Session password
                            </label>
                            <input
                                id="session-password"
                                type="password"
                                style={styles.input}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="At least 4 characters"
                                minLength={4}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div>
                            <label
                                style={styles.label}
                                htmlFor="session-expiry"
                            >
                                Expiration (optional)
                            </label>
                            <input
                                id="session-expiry"
                                type="datetime-local"
                                style={styles.input}
                                value={expiresAt}
                                onChange={(event) =>
                                    setExpiresAt(event.target.value)
                                }
                                min={new Date(
                                    Date.now() -
                                        new Date().getTimezoneOffset() * 60000,
                                )
                                    .toISOString()
                                    .slice(0, 16)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.primary,
                            opacity: creating ? 0.65 : 1,
                        }}
                        disabled={creating || loading}
                    >
                        {creating
                            ? "Creating session…"
                            : "Create & generate invite"}
                    </button>
                </form>
            </section>

            <section style={styles.card}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <h2 style={{ fontSize: 21, marginTop: 0 }}>
                        Your sessions
                    </h2>

                    <button
                        type="button"
                        style={styles.secondary}
                        onClick={loadData}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <p>Loading your sessions…</p>
                ) : sessions.length === 0 ? (
                    <p style={{ color: "#78716c" }}>
                        You haven't created a generalized session yet.
                    </p>
                ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                        {sessions.map((session) => (
                            <article
                                key={session._id}
                                style={{
                                    border: "1px solid #e7e5e4",
                                    borderRadius: 12,
                                    padding: 17,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div>
                                        <h3
                                            style={{
                                                margin: "0 0 7px",
                                                fontSize: 18,
                                            }}
                                        >
                                            {session.title}
                                        </h3>

                                        <p
                                            style={{
                                                margin: "0 0 10px",
                                                color: "#78716c",
                                                fontSize: 13,
                                            }}
                                        >
                                            {session.description ||
                                                "No description"}
                                        </p>

                                        <p
                                            style={{
                                                fontSize: 13,
                                                margin: "5px 0",
                                            }}
                                        >
                                            Invite code:{" "}
                                            <strong>
                                                {session.inviteCode}
                                            </strong>
                                        </p>

                                        <p
                                            style={{
                                                fontSize: 13,
                                                margin: "5px 0",
                                            }}
                                        >
                                            Exercises:{" "}
                                            {session.exercises?.length || 0}
                                        </p>

                                        <p
                                            style={{
                                                fontSize: 13,
                                                margin: "5px 0",
                                            }}
                                        >
                                            Participants:{" "}
                                            {session.participants?.length || 0}
                                        </p>

                                        <p
                                            style={{
                                                fontSize: 13,
                                                margin: "8px 0 0",
                                            }}
                                        >
                                            Status:{" "}
                                            <strong
                                                style={{
                                                    color: session.isActive
                                                        ? "#15803d"
                                                        : "#b91c1c",
                                                }}
                                            >
                                                {session.isActive
                                                    ? "Active"
                                                    : "Closed"}
                                            </strong>
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            style={styles.secondary}
                                            onClick={() =>
                                                copyInviteLink(session)
                                            }
                                        >
                                            Copy invite link
                                        </button>

                                        <button
                                            type="button"
                                            style={{
                                                ...styles.secondary,
                                                color: session.isActive
                                                    ? "#b91c1c"
                                                    : "#166534",
                                            }}
                                            onClick={() =>
                                                toggleStatus(session)
                                            }
                                        >
                                            {session.isActive
                                                ? "Close session"
                                                : "Reopen session"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
