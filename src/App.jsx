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
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#00A082",
      dark: "#007a63",
      light: "#33b39b",
      contrastText: "#fff",
    },
    secondary: {
      main: "#1e3a5f",
      dark: "#142a47",
      light: "#2d5080",
      contrastText: "#fff",
    },
    background: {
      default: "#f0f4f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a2332",
      secondary: "#5a6a7e",
    },
    error: { main: "#e53e3e" },
    warning: { main: "#dd6b20" },
    success: { main: "#38a169" },
    info: { main: "#3182ce" },
  },
  typography: {
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h3: { fontWeight: 800, letterSpacing: -0.5 },
    h4: { fontWeight: 800, letterSpacing: -0.5 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none", letterSpacing: 0.2 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)",
    "0 6px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
    "0 10px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
    "0 14px 28px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)",
    "0 16px 32px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)",
    "0 20px 40px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.06)",
    "0 24px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.08)",
    "0 28px 56px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
    "0 32px 64px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.10)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f0f4f8",
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 #f1f5f9",
          "&::-webkit-scrollbar": { width: 6, height: 6 },
          "&::-webkit-scrollbar-track": { background: "#f1f5f9" },
          "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: 3 },
          "&::-webkit-scrollbar-thumb:hover": { background: "#94a3b8" },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #0f2744 0%, #1a3254 55%, #00896d 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          padding: "8px 20px",
          transition: "all 0.2s ease",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #00A082 0%, #007a63 100%)",
          boxShadow: "0 4px 12px rgba(0,160,130,0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #00b893 0%, #00A082 100%)",
            boxShadow: "0 6px 18px rgba(0,160,130,0.4)",
            transform: "translateY(-1px)",
          },
        },
        outlinedPrimary: {
          borderColor: "#00A082",
          "&:hover": { backgroundColor: "rgba(0,160,130,0.06)", borderColor: "#007a63" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        elevation1: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
        elevation2: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
        elevation3: { boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
        elevation6: { boxShadow: "0 10px 30px rgba(0,0,0,0.10)" },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 700,
            backgroundColor: "#f8fafc",
            color: "#374151",
            fontSize: "0.75rem",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            borderBottom: "2px solid #e2e8f0",
            padding: "12px 16px",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: "rgba(0,160,130,0.035) !important" },
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #f1f5f9",
          padding: "10px 16px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: "0.75rem" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00A082" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00A082", borderWidth: 2 },
          },
          "& label.Mui-focused": { color: "#00A082" },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00A082" },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "1.125rem",
          borderBottom: "1px solid #f1f5f9",
          padding: "20px 24px 16px",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.75rem",
          backgroundColor: "#1a2332",
          padding: "6px 12px",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-selected": {
            backgroundColor: "rgba(0,160,130,0.1)",
            color: "#00A082",
            "& .MuiListItemIcon-root": { color: "#00A082" },
            "&:hover": { backgroundColor: "rgba(0,160,130,0.15)" },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "#f1f5f9" },
      },
    },
  },
});
import LocationTracker from "./components/LocationTracker";
import Supervisors from "./pages/Supervisors";
import "leaflet/dist/leaflet.css";
import Settings from "./pages/Settings";
import ActionCenter from "./pages/ActionCenter";

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
        <Box sx={{ mt: isAuthenticated ? "64px" : 0 }}>
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
/><Route
  path="/action-center"
  element={
    <ProtectedRoute>
      <ActionCenter />
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
  path="/supervisors"
  element={
    <ProtectedRoute>
      <Supervisors />
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