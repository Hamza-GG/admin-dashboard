// src/components/Navbar.jsx
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import authAxios from "../utils/authAxios";

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const BASE_URL = "https://employee-inspection-backend.onrender.com";


const handleLogout = async () => {
  try {
    await authAxios.post("/logout");
  } catch (err) {
    console.error("Failed to log out:", err);
  }

  localStorage.removeItem("token"); // Match key used in authAxios
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
        {/* Logo and Title */}
        <Box
          component={Link}
          to="/dashboard"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <img
            src="/rider.png" // make sure this exists in your public/ folder
            alt="logo"
            style={{ height: 52, marginRight: 30 }}
          />
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 700,
              letterSpacing: 1,
              fontSize: 22,
            }}
          >
            OPS Watcher
          </Typography>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button color="inherit" component={Link} to="/dashboard">
            Dashboard
          </Button>
            <Button color="inherit" component={Link} to="/users">
  Utilisateurs
</Button>
          <Button color="inherit" component={Link} to="/riders">
            Riders
          </Button>
          <Button color="inherit" component={Link} to="/inspections">
  Contrôles
</Button>

<Button color="inherit" component={Link} to="/inspection-form">
  Ajouter un contrôle
</Button>
          <Button
            color="inherit"
            variant="outlined"
            sx={{
              ml: 2,
              borderColor: "#fff",
              fontWeight: 700,
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
            }}
            onClick={handleLogout}
          >
            Déconnexion
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
