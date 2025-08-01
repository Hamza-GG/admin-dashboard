import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
} from "@mui/material";
import { Link } from "react-router-dom";
import GroupIcon from "@mui/icons-material/Group";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useEffect, useState } from "react";
import { fetchWithAutoRefresh } from "../utils/api";

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchWithAutoRefresh("/users/me")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Failed to fetch user info:", err));
  }, []);

  return (
    <Box
      minHeight="100vh"
      width="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: "#fff",
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, letterSpacing: 1, mb: 1, mt: 0 }}
        >
          Admin Dashboard
        </Typography>

        {user && (
          <Typography variant="h6" sx={{ mb: 4 }}>
            Welcome, {user.username} 👋
          </Typography>
        )}

        <Grid container spacing={6} justifyContent="center" alignItems="stretch">
          {/* Riders Card */}
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Card
              sx={{
                flexGrow: 1,
                boxShadow: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.03)", boxShadow: 12 },
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <GroupIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Riders
                </Typography>
                <Typography color="text.secondary" align="center">
                  Afficher, modifier ou rechercher des riders
                </Typography>
              </CardContent>
              <CardActions sx={{ width: "100%" }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/riders"
                  size="large"
                  fullWidth
                >
                  GÉRER LES RIDERS
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Controls Card */}
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Card
              sx={{
                flexGrow: 1,
                boxShadow: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.03)", boxShadow: 12 },
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <FactCheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Contrôles
                </Typography>
                <Typography color="text.secondary" align="center">
                  Afficher, modifier, rechercher ou supprimer des contrôles.
                </Typography>
              </CardContent>
              <CardActions
                sx={{
                  flexDirection: "column",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  component={Link}
                  to="/inspections"
                  size="large"
                  fullWidth
                >
                  GÉRER LES CONTRÔLES
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "orange", color: "#fff", "&:hover": { bgcolor: "#ff9800" } }}
                  component={Link}
                  to="/inspection-form"
                  size="large"
                  fullWidth
                  startIcon={<AddCircleOutlineIcon />}
                >
                  NOUVEAU CONTRÔLE
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;