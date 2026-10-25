import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";
import Register from "./pages/Register";
import GeneralizedSessions from "./pages/GeneralizedSessions";
import JoinGeneralizedSession from "./pages/JoinGeneralizedSession";
import GeneralizedSessionExercise from "./pages/GeneralizedSessionExercise";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/patient"
                        element={
                            <ProtectedRoute role="PATIENT">
                                <PatientDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/physio"
                        element={
                            <ProtectedRoute role="PHYSIO">
                                <PhysioDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/physio/generalized-sessions"
                        element={
                            <ProtectedRoute role="PHYSIO">
                                <GeneralizedSessions />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Login />} />

                    <Route
                        path="/join-session/:inviteCode"
                        element={<JoinGeneralizedSession />}
                    />

                    <Route
                        path="/generalized-session/:inviteCode/exercise"
                        element={<GeneralizedSessionExercise />}
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
