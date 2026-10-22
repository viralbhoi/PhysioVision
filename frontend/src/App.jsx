import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";
import Register from "./pages/Register";

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

                    <Route path="*" element={<Login />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
