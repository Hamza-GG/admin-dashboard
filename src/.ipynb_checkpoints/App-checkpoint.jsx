import React, { useEffect, useState } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Riders from "./pages/Riders";
import Inspections from "./pages/Inspections";
import InspectionForm from "./pages/InspectionForm";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Users from "./pages/Users";

const theme = createTheme();

// ✅ Location tracking component
function LocationTracker() {
  useEffect(() => {
    const sendLocation = async () => {
      console.log("📡 Trying to get location...");

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log("📍 Got location:", latitude, longitude);

            try {
              const res = await fetch("/api/locations", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ latitude, longitude }),
              });

              const resText = await res.text();
              console.log("✅ Location sent, status:", res.status, resText);

              if (!res.ok) {
                console.error("⚠️ Server rejected the request:", res.status);
              }
            } catch (error) {
              console.error("❌ Failed to send location:", error);
            }
          },
          (error) => {
            console.warn("⚠️ Geolocation error:", error);
          },
          { enableHighAccuracy: true }
        );
      } else {
        console.warn("❌ Geolocation not supported");
      }
    };

    sendLocation();
    const intervalId = setInterval(sendLocation, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return null;
}

// ✅ Protected route wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// ✅ Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const onStorage = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
        {isAuthenticated && <LocationTracker />}
        <Box sx={{ mt: isAuthenticated ? 8 : 0 }}>
          <Routes>
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/riders"
              element={
                <ProtectedRoute>
                  <Riders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections"
              element={
                <ProtectedRoute>
                  <Inspections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspection-form"
              element={
                <ProtectedRoute>
                  <InspectionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}