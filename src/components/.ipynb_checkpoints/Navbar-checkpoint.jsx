import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ setIsAuthenticated }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated && setIsAuthenticated(false);
    navigate("/login");
  };

  // All your nav links in one place for easy mapping
  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Riders", to: "/riders" },
    { label: "Inspections", to: "/inspections" },
    { label: "Add Inspection", to: "/inspection-form" },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          left: 0,
          top: 0,
          right: 0,
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
            px: 2,
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
              fontSize: { xs: 18, sm: 22 },
            }}
          >
            INSPECTION ADMIN
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
            {navLinks.map((item) => (
              <Button
                key={item.to}
                color="inherit"
                component={Link}
                to={item.to}
                sx={{ fontWeight: 500 }}
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
              Logout
            </Button>
          </Box>

          {/* Hamburger Icon for mobile */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 220 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Menu
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List>
            {navLinks.map((item) => (
              <ListItem
                button
                key={item.to}
                component={Link}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <ListItem button onClick={() => { setDrawerOpen(false); handleLogout(); }}>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;