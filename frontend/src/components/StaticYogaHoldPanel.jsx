function formatTime(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export default function StaticYogaHoldPanel({
    result,
    targetHoldSeconds = 30,
}) {
    const score = Number.isFinite(result?.score) ? result.score : null;
    const held = Math.max(0, Number(result?.holdSeconds ?? 0));
    const target = Math.max(1, Number(targetHoldSeconds) || 30);
    const reliable = Boolean(result?.trackingReliable);
    const matched = Boolean(result?.isPoseMatched && reliable);
    const enabled = Boolean(result?.enabled);
    const completed = Boolean(result?.holdCompleted);
    const progress = Math.min(100, (held / target) * 100);

    let status = "Align your pose";
    let statusClass = "bg-amber-100 text-amber-800";
    let detail =
        "Move into the reference posture. The timer starts automatically once your pose is confirmed.";

    if (completed) {
        status = "Pose completed";
        statusClass = "bg-emerald-100 text-emerald-700";
        detail = "You reached the target hold duration.";
    } else if (!reliable) {
        status = "Tracking lost";
        statusClass = "bg-rose-100 text-rose-700";
        detail =
            "Keep the required body joints visible. The timer will resume automatically when tracking recovers.";
    } else if (enabled && matched) {
        status = "Hold steady";
        statusClass = "bg-emerald-100 text-emerald-700";
        detail = "Your valid hold time is counting automatically.";
    } else if (reliable && !matched) {
        status = "Adjust your pose";
        statusClass = "bg-amber-100 text-amber-800";
        detail =
            "Match the reference posture. Your accumulated valid hold time is preserved.";
    } else if (matched) {
        status = "Confirming pose";
        statusClass = "bg-blue-100 text-blue-700";
        detail = "Keep the pose steady; the timer will start automatically.";
    }

    return (
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Static yoga pose
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                        Automatic hold timer
                    </h2>
                </div>
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                >
                    {status}
                </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Pose match</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                        {score === null ? "—" : `${Math.round(score)}%`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Required: {result?.matchThreshold ?? 75}%
                    </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Valid hold time</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                        {formatTime(held)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Target: {formatTime(target)}
                    </p>
                </div>
            </div>

            <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Yoga hold progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
            >
                <div
                    className={`h-full rounded-full transition-[width] duration-200 ${completed ? "bg-emerald-500" : "bg-emerald-500"}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="mt-3 text-sm leading-5 text-slate-600">{detail}</p>
            {completed && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    Hold completed. The timer has stopped automatically.
                </div>
            )}
        </section>
    );
}
