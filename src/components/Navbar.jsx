import React, { useEffect, useState } from "react";
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
  const [userRole, setUserRole] = useState(() => localStorage.getItem("role")); // quick read
  const [roleLoaded, setRoleLoaded] = useState(!!localStorage.getItem("role"));

  useEffect(() => {
    // If role not cached, fetch it
    if (!userRole) {
      (async () => {
        try {
          // ✅ Your backend exposes this endpoint
          const res = await authAxios.get("/users/me");
          const role = res?.data?.role || null;
          setUserRole(role);
          if (role) localStorage.setItem("role", role);
        } catch (e) {
          console.error("Failed to fetch current user role:", e);
        } finally {
          setRoleLoaded(true);
        }
      })();
    } else {
      setRoleLoaded(true);
    }
  }, [userRole]);

  const handleLogout = async () => {
    try {
      await authAxios.post("/logout");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // All items
  const navItems = [
    { label: "Home", to: "/dashboard" },
    { label: "Utilisateurs", to: "/users" },
    { label: "Riders", to: "/riders" },
    { label: "Superviseurs", to: "/supervisors" },
    { label: "Contrôles", to: "/inspections" },
    { label: "Ajouter un contrôle", to: "/inspection-form" },
      { label: "Settings", to: "/settings" },
      { label: "Action Center", to: "/action-center" },
  ];

  // Role-based filtering
 const filteredNavItems =
  userRole === "supervisor"
    ? navItems.filter((i) =>
        ["/dashboard", "/riders", "/inspections", "/inspection-form"].includes(
          i.to
        )
      )
    : navItems;

  return (
    <AppBar position="fixed" sx={{ backgroundColor: "#00A082" }} elevation={3}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo + Title */}
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

        {/* Don’t render links until we know the role, to avoid a brief flash */}
        {!roleLoaded ? null : isMobile ? (
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
              <Button key={item.to} color="inherit" component={Link} to={item.to}>
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