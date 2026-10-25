function SessionDetailReport({ session, onBack }) {
    if (!session) return null;

    const score = Number(session.averageScore ?? 0);
    const repScores = Array.isArray(session.repScores) ? session.repScores : [];
    const repetitions = Array.isArray(session.repetitions)
        ? session.repetitions
        : [];

    const formatDateTime = (value) => {
        if (!value) return "Not recorded";

        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "Not recorded"
            : date.toLocaleString();
    };

    const formatDuration = (value) => {
        const seconds = Math.max(0, Number(value) || 0);
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);

        return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
    };

    const Detail = ({ label, value }) => (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
                {value ?? "Not recorded"}
            </p>
        </div>
    );

    return (
        <div className="min-h-full bg-slate-50">
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                    ← Back to session history
                </button>

                <header className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                        Session report
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">
                        {session.exercise?.name || "Exercise session"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Completed: {formatDateTime(session.completedAt)}
                    </p>
                </header>

                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm font-medium text-slate-500">
                        Overall score
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-slate-900">
                            {Math.round(score)}
                        </span>
                        <span className="text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                                width: `${Math.min(100, Math.max(0, score))}%`,
                            }}
                        />
                    </div>
                </section>

                <h2 className="mb-3 text-lg font-semibold text-slate-900">
                    Session details
                </h2>

                <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail label="Session ID" value={session._id} />
                    <Detail
                        label="Exercise"
                        value={session.exercise?.name || "Exercise"}
                    />
                    <Detail
                        label="Status"
                        value={session.status || "Not recorded"}
                    />
                    <Detail
                        label="Completed repetitions"
                        value={session.completedReps ?? 0}
                    />
                    <Detail
                        label="Target repetitions"
                        value={session.targetReps ?? "Not recorded"}
                    />
                    <Detail
                        label="Duration"
                        value={formatDuration(session.duration)}
                    />
                    <Detail
                        label="Started at"
                        value={formatDateTime(session.startedAt)}
                    />
                    <Detail
                        label="Completed at"
                        value={formatDateTime(session.completedAt)}
                    />
                    <Detail
                        label="Created at"
                        value={formatDateTime(session.createdAt)}
                    />
                    <Detail
                        label="Last updated"
                        value={formatDateTime(session.updatedAt)}
                    />
                    <Detail
                        label="Assignment ID"
                        value={
                            typeof session.assignment === "object"
                                ? session.assignment?._id
                                : session.assignment
                        }
                    />
                    <Detail
                        label="Patient ID"
                        value={
                            typeof session.patient === "object"
                                ? session.patient?._id
                                : session.patient
                        }
                    />
                </section>

                <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 p-5">
                        <h2 className="font-semibold text-slate-900">
                            Repetition scores
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Individual scores recorded during this session.
                        </p>
                    </div>

                    {repScores.length === 0 ? (
                        <p className="p-5 text-sm text-slate-500">
                            No individual repetition scores were recorded.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-5">
                            {repScores.map((value, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl bg-slate-50 p-4"
                                >
                                    <p className="text-xs text-slate-400">
                                        Rep {index + 1}
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">
                                        {Math.round(Number(value) || 0)} / 100
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {repetitions.length > 0 && (
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 p-5">
                            <h2 className="font-semibold text-slate-900">
                                Recorded repetition details
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {repetitions.map((rep, index) => (
                                <div
                                    key={rep._id || index}
                                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                                >
                                    <span className="font-medium text-slate-800">
                                        Rep {rep.number ?? index + 1}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                        Score: {rep.score ?? 0}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                        Duration: {formatDuration(rep.duration)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <p className="mt-5 text-xs leading-5 text-slate-400">
                    This report displays the fields returned by the API. Fields
                    not returned by the server cannot be displayed here.
                </p>
            </main>
        </div>
    );
}

export default SessionDetailReport;
