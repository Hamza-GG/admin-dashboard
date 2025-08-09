import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import authAxios from "../utils/authAxios";

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Fetch role from backend or localStorage
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await authAxios.get("/api/me"); // Adjust to your API endpoint
        setUserRole(res.data.role); // e.g. "admin" or "supervisor"
      } catch (err) {
        console.error("Failed to fetch user role:", err);
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      await authAxios.post("/logout");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // All navigation items
  const navItems = [
    { label: "Home", to: "/dashboard" },
    { label: "Utilisateurs", to: "/users" },
    { label: "Riders", to: "/riders" },
    { label: "Superviseurs", to: "/supervisors" },
    { label: "Contrôles", to: "/inspections" },
    { label: "Ajouter un contrôle", to: "/inspection-form" },
  ];

  // Filter based on role
  const filteredNavItems =
    userRole === "supervisor"
      ? navItems.filter((item) => item.to === "/inspection-form")
      : navItems;

  return (
    <AppBar position="fixed" sx={{ backgroundColor: "#00A082" }} elevation={3}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo and Title */}
        <Box
          component={Link}
          to="/dashboard"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <img
            src="/rider.gif"
            alt="logo"
            style={{ height: 52, marginRight: 30 }}
            type="image/gif"
          />
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
            OPS Watcher
          </Typography>
        </Box>

        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {filteredNavItems.map((item) => (
                <MenuItem
                  key={item.to}
                  component={Link}
                  to={item.to}
                  onClick={handleMenuClose}
                >
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  handleLogout();
                  handleMenuClose();
                }}
              >
                Déconnexion
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            {filteredNavItems.map((item) => (
              <Button
                key={item.to}
                color="inherit"
                component={Link}
                to={item.to}
              >
                {item.label}
              </Button>
            ))}
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
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;