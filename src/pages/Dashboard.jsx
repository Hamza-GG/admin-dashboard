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
  const cards = [
    {
      icon: <GroupIcon sx={{ fontSize: 36, color: "#00A082" }} />,
      iconBg: "rgba(0,160,130,0.1)",
      accentColor: "linear-gradient(90deg, #00A082, #007a63)",
      title: "Riders",
      desc: "Afficher, modifier ou rechercher des riders",
      buttons: [
        { label: "Gérer les Riders", color: "primary", to: "/riders" },
      ],
    },
    {
      icon: <FactCheckIcon sx={{ fontSize: 36, color: "#3182ce" }} />,
      iconBg: "rgba(49,130,206,0.1)",
      accentColor: "linear-gradient(90deg, #3182ce, #2563eb)",
      title: "Contrôles",
      desc: "Afficher, modifier, rechercher ou supprimer des contrôles.",
      buttons: [
        { label: "Gérer les Contrôles", color: "primary", to: "/inspections" },
        {
          label: "+ Nouveau Contrôle",
          to: "/inspection-form",
          customStyle: {
            background: "linear-gradient(135deg, #dd6b20, #c05621)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(221,107,32,0.35)",
            "&:hover": {
              background: "linear-gradient(135deg, #ed8936, #dd6b20)",
              boxShadow: "0 6px 16px rgba(221,107,32,0.45)",
            },
          },
        },
      ],
    },
  ];

  return (
    <Box
      minHeight="100vh"
      width="100vw"
      sx={{
        background: "linear-gradient(160deg, #f0f4f8 0%, #e8f4f0 50%, #f0f4f8 100%)",
        paddingY: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="lg">
        {/* Hero header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f2744 0%, #00A082 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: -1,
            }}
          >
            Admin Dashboard
          </Typography>
          {user && (
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                mt: 1,
              }}
            >
              Bienvenue,{" "}
              <Box
                component="span"
                sx={{ color: "#00A082", fontWeight: 700 }}
              >
                {user.username}
              </Box>{" "}
              👋
            </Typography>
          )}
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {cards.map((card, index) => (
            <Grid item xs={12} md={6} key={index} sx={{ display: "flex" }}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1,
                  borderRadius: 3,
                  overflow: "hidden",
                  position: "relative",
                  border: "1px solid rgba(0,0,0,0.06)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: card.accentColor,
                  },
                }}
              >
                <CardContent
                  sx={{
                    textAlign: "center",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pt: 4,
                    pb: 2,
                    px: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      bgcolor: card.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2.5,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    {card.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
                    {card.desc}
                  </Typography>
                </CardContent>
                <CardActions
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    px: 3,
                    pb: 3,
                  }}
                >
                  {card.buttons.map((btn, i) => (
                    <Button
                      key={i}
                      variant="contained"
                      color={btn.color || "primary"}
                      component={Link}
                      to={btn.to}
                      size="large"
                      fullWidth
                      sx={{ py: 1.25, fontSize: "0.875rem", ...btn.customStyle }}
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