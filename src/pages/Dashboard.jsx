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
import authAxios from "../utils/authAxios";

function Dashboard() {
  const [user, setUser] = useState(null);

useEffect(() => {
  authAxios
    .get("/users/me")
    .then((res) => setUser(res.data))
    .catch((err) => console.error("Failed to fetch user info:", err));
}, []);
  return (
    <Box
      minHeight="100vh"
      width="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: "#fff", paddingY: 4 }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Admin Dashboard
        </Typography>

        {user && (
          <Typography variant="h6" align="center" sx={{ mb: 4 }}>
            Welcome, {user.username} 👋
          </Typography>
        )}

        <Grid container spacing={4} justifyContent="center">
          {[ // Riders and Controls config
            {
              icon: <GroupIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />,
              title: "Riders",
              desc: "Afficher, modifier ou rechercher des riders",
              buttons: [
                {
                  label: "GÉRER LES RIDERS",
                  color: "primary",
                  to: "/riders",
                },
              ],
            },
            {
              icon: <FactCheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />,
              title: "Contrôles",
              desc: "Afficher, modifier, rechercher ou supprimer des contrôles.",
              buttons: [
                {
                  label: "GÉRER LES CONTRÔLES",
                  color: "success",
                  to: "/inspections",
                },
                {
                  label: "➕ NOUVEAU CONTRÔLE",
                  color: "warning",
                  to: "/inspection-form",
                  customStyle: {
                    bgcolor: "orange",
                    color: "white",
                    "&:hover": {
                      bgcolor: "#ff9800",
                    },
                  },
                },
              ],
            },
          ].map((card, index) => (
            <Grid item xs={12} md={6} key={index} sx={{ display: "flex" }}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flex: 1,
                  boxShadow: 6,
                  padding: 2,
                }}
              >
                <CardContent
                  sx={{
                    textAlign: "center",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {card.icon}
                  <Typography variant="h5" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography color="text.secondary">{card.desc}</Typography>
                </CardContent>
                <CardActions
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {card.buttons.map((btn, i) => (
                    <Button
                      key={i}
                      variant="contained"
                      color={btn.color}
                      component={Link}
                      to={btn.to}
                      size="large"
                      fullWidth
                      sx={btn.customStyle}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;