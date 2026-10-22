import { useState } from "react";
import { generateConnectionCode } from "../services/api";

const AddPatient = ({ onClose }) => {
    const [code, setCode] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError("");
            setCopied(false);

            const response = await generateConnectionCode();

            setCode(response.code);
            setExpiresAt(response.expiresAt);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        if (!code) {
            return;
        }

        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            setError("Unable to copy the connection code.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* ================================================= */}
                {/* Header */}
                {/* ================================================= */}

                <div className="border-b border-slate-100 px-6 py-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <div className="flex items-center gap-3 pr-8">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19a4 4 0 0 0-8 0"
                                />
                                <circle cx="11" cy="7" r="3" />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 8v6M16 11h6"
                                />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Connect Patient
                            </h2>

                            <p className="mt-0.5 text-sm text-slate-500">
                                Securely connect a patient to your account.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================================================= */}
                {/* Content */}
                {/* ================================================= */}

                <div className="px-6 py-6">
                    {error && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <svg
                                className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path
                                    strokeLinecap="round"
                                    d="M12 8v4M12 16h.01"
                                />
                            </svg>

                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {!code ? (
                        <>
                            <div className="rounded-xl bg-slate-50 p-4">
                                <div className="flex gap-3">
                                    <div className="mt-0.5 shrink-0 text-blue-600">
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        >
                                            <circle cx="12" cy="12" r="9" />
                                            <path
                                                strokeLinecap="round"
                                                d="M12 11v5M12 8h.01"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            Generate a connection code
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Generate a unique code and share it
                                            with your patient. They can enter
                                            the code from their dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={loading}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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

                                {loading
                                    ? "Generating..."
                                    : "Generate Connection Code"}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Generated code */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500">
                                    Patient Connection Code
                                </p>

                                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-6">
                                    <p className="select-all font-mono text-3xl font-bold tracking-[0.2em] text-blue-700">
                                        {code}
                                    </p>
                                </div>
                            </div>

                            {/* Copy */}
                            <button
                                type="button"
                                onClick={copyCode}
                                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                    copied
                                        ? "bg-emerald-600 text-white"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m6 12 4 4 8-8"
                                            />
                                        </svg>
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        >
                                            <rect
                                                x="8"
                                                y="8"
                                                width="11"
                                                height="11"
                                                rx="2"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                                            />
                                        </svg>
                                        Copy Code
                                    </>
                                )}
                            </button>

                            {/* Expiry */}
                            {expiresAt && (
                                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path
                                            strokeLinecap="round"
                                            d="M12 7v5l3 2"
                                        />
                                    </svg>

                                    <span>
                                        Expires{" "}
                                        {new Date(expiresAt).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-slate-700">
                                    Next step
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Share this code with your patient through
                                    WhatsApp, SMS, or any other secure channel.
                                    They can enter it from their dashboard to
                                    establish the connection.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* ================================================= */}
                {/* Footer */}
                {/* ================================================= */}

                <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPatient;
