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

const theme = createTheme(); // Customize as needed

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const onStorage = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {/* Global responsive CSS for mobile-friendliness */}
      <style>
        {`
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background: #f7fafd;
          }
          * {
            box-sizing: inherit;
          }
          body {
            width: 100vw;
            max-width: 100vw;
            overflow-x: hidden;
          }
          @media (max-width: 600px) {
            .MuiContainer-root, .MuiBox-root {
              padding-left: 2vw !important;
              padding-right: 2vw !important;
            }
            .MuiPaper-root, .MuiCard-root {
              width: 100% !important;
              margin: 16px 0 !important;
              border-radius: 16px !important;
              box-shadow: 0 1px 6px rgba(0,0,0,0.07);
            }
            h1, h2, h3, h4 {
              font-size: 2rem !important;
              text-align: center !important;
            }
            .MuiButton-root, .MuiButtonBase-root {
              width: 100% !important;
              font-size: 1.05rem !important;
              margin: 8px 0 !important;
              padding: 12px !important;
            }
            .MuiToolbar-root {
              flex-wrap: wrap !important;
              justify-content: flex-start !important;
              min-height: 56px !important;
            }
            .MuiAppBar-root .MuiTypography-root {
              font-size: 1.1rem !important;
            }
          }
        `}
      </style>
      <CssBaseline />
      <Router>
        {/* Navbar fixed at top, only when authenticated */}
        {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
        {/* All page content pushed down by 64px (default AppBar height) */}
        <Box sx={{ mt: isAuthenticated ? 8 : 0 }}>
          <Routes>
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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