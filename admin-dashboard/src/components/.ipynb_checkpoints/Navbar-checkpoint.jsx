// src/components/Navbar.jsx
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();

const BASE_URL = "https://employee-inspection-backend.onrender.com";

const handleLogout = async () => {
  try {
    await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      credentials: "include", // ensures refresh_token is cleared
    });
  } catch (err) {
    console.error("Failed to log out:", err);
  }

  // Clean both for safety
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");

  setIsAuthenticated(false);
  navigate("/login");
};

  return (
    <AppBar
      position="fixed"
      sx={{
        left: 0,
        top: 0,
        right: 0,
        boxShadow: 2,
        backgroundColor: "#1976d2",
        zIndex: 1300,
        width: "100%",
        minHeight: 64,
        m: 0,
        p: 0,
      }}
      elevation={3}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 3,
          minHeight: 64,
          width: "100%",
          maxWidth: "100vw",
        }}
      >
        <Typography
          variant="h6"
          component={Link}
          to="/dashboard"
          sx={{
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            letterSpacing: 1,
            fontSize: 22,
          }}
        >
          INSPECTION ADMIN
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button color="inherit" component={Link} to="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/riders">
            Riders
          </Button>
          <Button color="inherit" component={Link} to="/inspections">
            Inspections
          </Button>
          <Button color="inherit" component={Link} to="/inspection-form">
            Add Inspection
          </Button>
          <Button
            color="inherit"
            variant="outlined"
            sx={{
              ml: 2,
              borderColor: "#fff",
              fontWeight: 700,
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.15)" }
            }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;