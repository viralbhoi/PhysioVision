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
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
                <header className="mb-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                        PhysioVision · Live sessions
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Generalized Sessions
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                        Create a shared exercise session and invite participants
                        with a link and password. Participants do not need an
                        existing patient–physiotherapist assignment.
                    </p>
                </header>
                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}
                {notice && (
                    <div
                        role="status"
                        className="mb-5 break-words rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
                    >
                        {notice}
                    </div>
                )}

                <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Create a session
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Choose exercises, set access details, and share the
                            invite.
                        </p>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div>
                            <label
                                className="mb-2 block text-sm font-medium text-slate-700"
                                htmlFor="session-title"
                            >
                                Session title
                            </label>
                            <input
                                id="session-title"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="e.g. Morning mobility session"
                                maxLength={120}
                                required
                            />
                        </div>
                        <div>
                            <label
                                className="mb-2 block text-sm font-medium text-slate-700"
                                htmlFor="session-description"
                            >
                                Description{" "}
                                <span className="font-normal text-slate-400">
                                    (optional)
                                </span>
                            </label>
                            <textarea
                                id="session-description"
                                className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Instructions or details for participants"
                                maxLength={1000}
                            />
                        </div>
                        <div>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Select exercises
                                </label>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    {selectedExercises.length} selected
                                </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                                {loading ? (
                                    <p className="p-4 text-sm text-slate-500">
                                        Loading exercises…
                                    </p>
                                ) : exercises.length === 0 ? (
                                    <p className="p-4 text-sm text-slate-500">
                                        No exercises were returned by your
                                        exercise API.
                                    </p>
                                ) : (
                                    exercises.map((exercise) => {
                                        const id = getExerciseId(exercise);
                                        if (!id) return null;
                                        const selected =
                                            selectedExercises.includes(id);
                                        return (
                                            <label
                                                key={id}
                                                className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm last:border-0 hover:bg-slate-50 ${selected ? "bg-blue-50/60" : "bg-white"}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selected}
                                                    onChange={() =>
                                                        toggleExercise(id)
                                                    }
                                                />
                                                <span
                                                    className={`font-medium ${selected ? "text-blue-900" : "text-slate-700"}`}
                                                >
                                                    {getExerciseName(exercise)}
                                                </span>
                                                {selected && (
                                                    <span className="ml-auto text-xs font-semibold text-blue-700">
                                                        Selected
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                    htmlFor="session-password"
                                >
                                    Session password
                                </label>
                                <input
                                    id="session-password"
                                    type="password"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="At least 4 characters"
                                    minLength={4}
                                    autoComplete="new-password"
                                    required
                                />
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Participants need this password to join.
                                </p>
                            </div>
                            <div>
                                <label
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                    htmlFor="session-expiry"
                                >
                                    Expiration{" "}
                                    <span className="font-normal text-slate-400">
                                        (optional)
                                    </span>
                                </label>
                                <input
                                    id="session-expiry"
                                    type="datetime-local"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                    value={expiresAt}
                                    onChange={(event) =>
                                        setExpiresAt(event.target.value)
                                    }
                                    min={new Date(
                                        Date.now() -
                                            new Date().getTimezoneOffset() *
                                                60000,
                                    )
                                        .toISOString()
                                        .slice(0, 16)}
                                />
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Leave blank if the invite should not expire.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-400">
                                You can close or reopen the session later.
                            </p>
                            <button
                                type="submit"
                                disabled={creating || loading}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creating
                                    ? "Creating session…"
                                    : "Create & generate invite"}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Your sessions
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Manage invites and check session activity.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            onClick={loadData}
                            disabled={loading}
                        >
                            Refresh
                        </button>
                    </div>
                    {loading ? (
                        <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                            Loading your sessions…
                        </p>
                    ) : sessions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                                No sessions yet
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Create your first generalized session above to
                                get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {sessions.map((session) => (
                                <article
                                    key={session._id}
                                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5"
                                >
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <h3 className="break-words text-base font-semibold text-slate-900">
                                                    {session.title}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                                                >
                                                    {session.isActive
                                                        ? "Active"
                                                        : "Closed"}
                                                </span>
                                            </div>
                                            <p className="mb-4 text-sm leading-5 text-slate-500">
                                                {session.description ||
                                                    "No description"}
                                            </p>
                                            <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2.5">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Invite code
                                                </p>
                                                <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">
                                                    {session.inviteCode}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-lg border border-slate-100 px-3 py-2">
                                                    <p className="text-xs text-slate-500">
                                                        Exercises
                                                    </p>
                                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                                        {session.exercises
                                                            ?.length || 0}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-slate-100 px-3 py-2">
                                                    <p className="text-xs text-slate-500">
                                                        Participants
                                                    </p>
                                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                                        {session.participants
                                                            ?.length || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                                            <button
                                                type="button"
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                                                onClick={() =>
                                                    copyInviteLink(session)
                                                }
                                            >
                                                Copy invite link
                                            </button>
                                            <button
                                                type="button"
                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm ${session.isActive ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
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
        </div>
    );
}
