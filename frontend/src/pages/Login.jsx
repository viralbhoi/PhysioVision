import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (user) {
        return (
            <Navigate
                to={user.role === "PHYSIO" ? "/physio" : "/patient"}
                replace
            />
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);

            const loggedInUser = await login(email, password);

            if (loggedInUser.role === "PHYSIO") {
                navigate("/physio");
            } else {
                navigate("/patient");
            }
        } catch (err) {
            setError(err.message || "Unable to login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* =================================================
                    Brand / Product Panel
                ================================================= */}

                <div className="relative hidden overflow-hidden bg-slate-950 lg:flex">
                    <div className="absolute inset-0">
                        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
                        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
                    </div>

                    <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                                P
                            </div>

                            <div>
                                <div className="text-lg font-semibold tracking-tight text-white">
                                    PhysioVision
                                </div>

                                <div className="text-xs text-slate-500">
                                    Intelligent rehabilitation
                                </div>
                            </div>
                        </div>

                        {/* Main message */}
                        <div className="max-w-xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Smart physiotherapy platform
                            </div>

                            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                                Smarter rehabilitation.
                                <br />
                                <span className="text-blue-400">
                                    Better recovery.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                                PhysioVision helps physiotherapists track
                                patient progress and gives patients real-time
                                movement feedback during their exercises.
                            </p>

                            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-800 pt-7">
                                <div>
                                    <p className="text-xl font-semibold text-white">
                                        3D
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Motion tracking
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xl font-semibold text-white">
                                        Live
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Exercise feedback
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xl font-semibold text-white">
                                        Progress
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Patient insights
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <p className="text-xs text-slate-600">
                            © {new Date().getFullYear()} PhysioVision
                        </p>
                    </div>
                </div>

                {/* =================================================
                    Login Panel
                ================================================= */}

                <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                                P
                            </div>

                            <div>
                                <div className="font-semibold tracking-tight text-slate-900">
                                    PhysioVision
                                </div>

                                <div className="text-xs text-slate-400">
                                    Intelligent rehabilitation
                                </div>
                            </div>
                        </div>

                        {/* Heading */}
                        <div className="mb-8">
                            <p className="mb-2 text-sm font-medium text-blue-600">
                                WELCOME BACK
                            </p>

                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Sign in to your account
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Continue managing your rehabilitation journey
                                with PhysioVision.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                                    !
                                </div>

                                <p>{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Password
                                    </label>

                                    <button
                                        type="button"
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) => !previous,
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </button>
                        </form>

                        {/* Register */}
                        <div className="mt-8 border-t border-slate-200 pt-7 text-center">
                            <p className="text-sm text-slate-500">
                                Don't have an account?{" "}
                                <Link
                                    to="/register"
                                    className="font-semibold text-blue-600 transition hover:text-blue-700"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </div>

                        {/* Security */}
                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                                ✓
                            </span>
                            Your account information is securely protected.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
