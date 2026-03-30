import React, { useEffect, useMemo, useState } from "react";
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
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authAxios from "../utils/authAxios";
import { useTranslation } from "react-i18next";

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { i18n } = useTranslation();

  const currentLang = useMemo(() => {
    const l = String(i18n?.language || "fr");
    return l.startsWith("en") ? "en" : "fr";
  }, [i18n?.language]);

  const setLang = (lng) => {
    const next = String(lng || "fr");
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

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
    { label: "Superviseurs", to: "/supervisors" },
    { label: "Contrôles", to: "/inspections" },
    { label: "Ajouter un contrôle", to: "/inspection-form" },
      { label: "Settings", to: "/settings" },
      { label: "Action Center", to: "/action-center" },
  ];

  // Role-based filtering
  const filteredNavItems =
    userRole === "supervisor" || userRole === "user"
      ? navItems.filter((i) =>
          [
            "/dashboard",
            "/inspections",
            "/inspection-form",
            ...(userRole === "user" ? ["/action-center"] : []),
          ].includes(i.to)
        )
      : navItems;

  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: 64, px: { xs: 2, sm: 3 } }}>
        {/* Logo + Title */}
        <Box
          component={Link}
          to="/dashboard"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 1.5 }}
        >
          <img
            src="/glopi.png"
            alt="logo"
            style={{ height: 44, borderRadius: 8, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}
            type="image/gif"
          />
          <Box>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.1, letterSpacing: 0.3 }}>
              OPS Watcher
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 400, letterSpacing: 0.5 }}>
              Admin Dashboard
            </Typography>
          </Box>
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
              <MenuItem disabled sx={{ opacity: 0.8, fontWeight: 700 }}>
                Langue
              </MenuItem>
              <MenuItem
                selected={currentLang === "fr"}
                onClick={() => {
                  setLang("fr");
                  handleMenuClose();
                }}
              >
                Français
              </MenuItem>
              <MenuItem
                selected={currentLang === "en"}
                onClick={() => {
                  setLang("en");
                  handleMenuClose();
                }}
              >
                English
              </MenuItem>
              <MenuItem divider />
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
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              maxWidth: "75vw",
            }}
          >
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Button
                  key={item.to}
                  color="inherit"
                  component={Link}
                  to={item.to}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    whiteSpace: "nowrap",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.8125rem",
                    letterSpacing: 0.2,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                    backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                    borderRadius: 2,
                    position: "relative",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.12)",
                      color: "#fff",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

            <Box sx={{ width: 1, height: 28, bgcolor: "rgba(255,255,255,0.15)", mx: 1 }} />

            <FormControl
              size="small"
              variant="outlined"
              sx={{
                minWidth: 88,
                bgcolor: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                "& .MuiInputBase-root": { color: "#fff", fontSize: "0.8125rem" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.6)" },
                "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
              }}
            >
              <InputLabel id="lang-select-label" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem" }}>
                Lang
              </InputLabel>
              <Select
                labelId="lang-select-label"
                value={currentLang}
                label="Lang"
                onChange={(e) => setLang(e.target.value)}
              >
                <MenuItem value="fr">FR</MenuItem>
                <MenuItem value="en">EN</MenuItem>
              </Select>
            </FormControl>

            <Button
              color="inherit"
              variant="outlined"
              sx={{
                ml: 0.5,
                borderColor: "rgba(255,255,255,0.35)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.9)",
                bgcolor: "rgba(255,255,255,0.06)",
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "rgba(255, 80, 80, 0.25)",
                  borderColor: "rgba(255,150,150,0.6)",
                  color: "#fff",
                },
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
