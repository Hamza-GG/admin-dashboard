import React, { Suspense, lazy, useEffect, useState } from "react";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Navbar from "./components/Navbar";

// Pages are loaded on demand so the first load only downloads what's needed.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Riders = lazy(() => import("./pages/Riders"));
const Inspections = lazy(() => import("./pages/Inspections"));
const InspectionForm = lazy(() => import("./pages/InspectionForm"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Settings = lazy(() => import("./pages/Settings"));

const theme = createTheme();

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
        <Box sx={{ mt: isAuthenticated ? 8 : 0 }}>
          <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>}>
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
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
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
          </Suspense>
        </Box>
      </Router>
    </ThemeProvider>
  );
}