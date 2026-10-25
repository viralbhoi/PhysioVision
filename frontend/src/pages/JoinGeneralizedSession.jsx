import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Unable to complete the request.");
    }

    return data;
}

export default function JoinGeneralizedSession() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadSession() {
            setLoading(true);
            setError("");

            try {
                const result = await request(
                    `/generalized-sessions/join/${encodeURIComponent(inviteCode)}`,
                );

                if (!cancelled) {
                    setSession(result.session);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "This session is unavailable.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (inviteCode) {
            loadSession();
        } else {
            setError("The invite code is missing.");
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [inviteCode]);

    async function handleJoin(event) {
        event.preventDefault();
        setError("");

        if (!displayName.trim()) {
            setError("Enter your name to continue.");
            return;
        }

        if (!password) {
            setError("Enter the session password.");
            return;
        }

        setJoining(true);

        try {
            const result = await request(
                `/generalized-sessions/join/${encodeURIComponent(inviteCode)}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        displayName: displayName.trim(),
                        password,
                    }),
                },
            );

            // Store only this participant's session identity.
            // This is not an authentication token.
            sessionStorage.setItem(
                `generalized-session:${inviteCode}`,
                JSON.stringify({
                    participantId: result.participantId,
                    sessionId: result.session?.id,
                    displayName: displayName.trim(),
                }),
            );

            navigate(`/generalized-session/${inviteCode}/exercise`, {
                state: {
                    participantId: result.participantId,
                    session: result.session,
                    displayName: displayName.trim(),
                },
            });
        } catch (err) {
            setError(err.message || "Unable to join the session.");
        } finally {
            setJoining(false);
        }
    }

    const cardStyle = {
        background: "#ffffff",
        border: "1px solid #e7e5e4",
        borderRadius: 18,
        padding: 28,
        boxShadow: "0 12px 40px rgba(41, 37, 36, 0.07)",
    };

    const inputStyle = {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 13px",
        border: "1px solid #d6d3d1",
        borderRadius: 9,
        fontSize: 15,
        outlineOffset: 2,
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                boxSizing: "border-box",
                padding: "32px 18px",
                display: "grid",
                placeItems: "center",
                background: "#faf8f6",
                color: "#292524",
            }}
        >
            <section style={{ width: "100%", maxWidth: 520 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            background: "#6b3e26",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 25,
                            margin: "0 auto 14px",
                        }}
                    >
                        +
                    </div>

                    <h1 style={{ fontSize: 29, margin: 0 }}>
                        Join a PhysioVision Session
                    </h1>

                    <p style={{ color: "#78716c", lineHeight: 1.6 }}>
                        Enter your details to join the shared exercise session.
                    </p>
                </div>

                <div style={cardStyle}>
                    {loading ? (
                        <p style={{ textAlign: "center" }}>
                            Loading session details…
                        </p>
                    ) : error && !session ? (
                        <div>
                            <p
                                role="alert"
                                style={{
                                    background: "#fef2f2",
                                    color: "#b91c1c",
                                    padding: 13,
                                    borderRadius: 9,
                                }}
                            >
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    border: 0,
                                    borderRadius: 9,
                                    background: "#6b3e26",
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                Try again
                            </button>
                        </div>
                    ) : session ? (
                        <>
                            <div
                                style={{
                                    paddingBottom: 18,
                                    marginBottom: 20,
                                    borderBottom: "1px solid #e7e5e4",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: 1,
                                        color: "#8b5e3c",
                                        textTransform: "uppercase",
                                        margin: "0 0 8px",
                                    }}
                                >
                                    You're invited to
                                </p>

                                <h2 style={{ margin: "0 0 9px", fontSize: 23 }}>
                                    {session.title}
                                </h2>

                                {session.description && (
                                    <p
                                        style={{
                                            margin: 0,
                                            color: "#78716c",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {session.description}
                                    </p>
                                )}

                                <div
                                    style={{
                                        marginTop: 16,
                                        background: "#f5f1ed",
                                        borderRadius: 9,
                                        padding: 12,
                                    }}
                                >
                                    <strong>
                                        {session.exercises?.length || 0}{" "}
                                        exercises
                                    </strong>

                                    {session.exercises?.length > 0 && (
                                        <ul
                                            style={{
                                                paddingLeft: 20,
                                                marginBottom: 0,
                                                lineHeight: 1.8,
                                            }}
                                        >
                                            {session.exercises.map(
                                                (exercise, index) => (
                                                    <li
                                                        key={
                                                            exercise._id ||
                                                            exercise.id ||
                                                            index
                                                        }
                                                    >
                                                        {exercise.name ||
                                                            exercise.title ||
                                                            exercise.exerciseName ||
                                                            "Exercise"}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleJoin}>
                                <div style={{ marginBottom: 17 }}>
                                    <label
                                        htmlFor="participant-name"
                                        style={{
                                            display: "block",
                                            fontWeight: 600,
                                            marginBottom: 7,
                                            fontSize: 14,
                                        }}
                                    >
                                        Your name
                                    </label>

                                    <input
                                        id="participant-name"
                                        autoComplete="name"
                                        maxLength={80}
                                        value={displayName}
                                        onChange={(event) =>
                                            setDisplayName(event.target.value)
                                        }
                                        placeholder="Enter your name"
                                        style={inputStyle}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label
                                        htmlFor="participant-password"
                                        style={{
                                            display: "block",
                                            fontWeight: 600,
                                            marginBottom: 7,
                                            fontSize: 14,
                                        }}
                                    >
                                        Session password
                                    </label>

                                    <input
                                        id="participant-password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        placeholder="Enter the password from your invite"
                                        style={inputStyle}
                                        required
                                    />
                                </div>

                                {error && (
                                    <p
                                        role="alert"
                                        style={{
                                            background: "#fef2f2",
                                            color: "#b91c1c",
                                            padding: 12,
                                            borderRadius: 9,
                                            fontSize: 14,
                                        }}
                                    >
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={joining}
                                    style={{
                                        width: "100%",
                                        padding: 13,
                                        border: 0,
                                        borderRadius: 9,
                                        background: "#6b3e26",
                                        color: "#fff",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: joining ? "wait" : "pointer",
                                        opacity: joining ? 0.65 : 1,
                                    }}
                                >
                                    {joining ? "Joining…" : "Join session"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <p>This session could not be loaded.</p>
                    )}
                </div>

                <p
                    style={{
                        textAlign: "center",
                        marginTop: 20,
                        color: "#78716c",
                        fontSize: 13,
                    }}
                >
                    Don't have a session link? Ask your physiotherapist for an
                    invite.
                </p>
            </section>
        </main>
    );
}
