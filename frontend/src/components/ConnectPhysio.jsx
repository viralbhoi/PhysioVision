import { useState } from "react";
import { connectToPhysiotherapist } from "../services/api";

const ConnectPhysio = ({ onConnected }) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleConnect = async (event) => {
        event.preventDefault();

        if (!code.trim()) {
            setError("Enter the connection code.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await connectToPhysiotherapist(code);

            onConnected?.(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <circle cx="9" cy="8" r="3" />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.5 19a5.5 5.5 0 0 1 11 0"
                        />
                        <path strokeLinecap="round" d="M17 11v6M14 14h6" />
                    </svg>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Connect to your Physiotherapist
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Enter the connection code provided by your
                        physiotherapist to connect your accounts.
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                    </svg>

                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleConnect} className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Connection Code
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={code}
                        onChange={(event) =>
                            setCode(event.target.value.toUpperCase())
                        }
                        placeholder="PV-XXXXXXXX"
                        maxLength={11}
                        autoComplete="off"
                        spellCheck="false"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-medium tracking-wider text-slate-900 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading && (
                            <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    className="opacity-25"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />

                                <path
                                    d="M21 12a9 9 0 0 0-9-9"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}

                        {loading ? "Connecting..." : "Connect"}
                    </button>
                </div>
            </form>

            {/* Help */}
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
                </svg>

                <p className="text-xs leading-5 text-slate-500">
                    Your physiotherapist needs to generate the code from their
                    dashboard and share it with you. Connection codes are
                    temporary and can only be used once.
                </p>
            </div>
        </div>
    );
};

export default ConnectPhysio;
