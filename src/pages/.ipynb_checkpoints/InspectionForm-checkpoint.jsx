import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios";
import { jwtDecode } from "jwt-decode";
import {
  Select, MenuItem, InputLabel, FormControl,
  Box, Typography, TextField, Button, Paper, Alert,
  CircularProgress, Stack, Grid, Divider
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";

/* -------- Error Boundary to avoid full blank page -------- */
class FormErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, err:null }; }
  static getDerivedStateFromError(err){ return { hasError:true, err }; }
  componentDidCatch(err, info){ console.error("Form crashed:", err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <Box sx={{ p:3 }}>
          <Alert severity="error" sx={{ mb:2 }}>
            Something went wrong while rendering the form.
          </Alert>
          <pre style={{ whiteSpace:"pre-wrap" }}>{String(this.state.err)}</pre>
        </Box>
      );
    }
    return this.props.children;
  }
}
/* --------------------------------------------------------- */

export default function InspectionForm() {
  const [form, setForm] = useState({
    rider_id: "",
    id_number: "",
    first_name: "",
    first_last_name: "",
    mfc_location: "",
    box_serial_number: "",
    plate_number: "",
    city: "",
    location: "",
    helmet: "",
    box: "",
    account: "",
    parking: "",
    appearance: "",
    driving: "",
    mfc_status: "",
    courier_behavior: "",
    image: null,
    comments: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [riders, setRiders] = useState([]);
  const token = localStorage.getItem("token");

  let inspected_by = "";
  try { inspected_by = jwtDecode(token)?.sub || ""; } catch { inspected_by = ""; }

  useEffect(() => {
    async function fetchRiders() {
      try {
        const res = await authAxios.get("https://employee-inspection-backend.onrender.com/riders");
        setRiders(res.data || []);
      } catch (e) {
        console.warn("Failed to fetch riders", e);
      }
    }
    fetchRiders();
  }, [token]);

  function autofillByField(field, value) {
    if (!value) return;
    const v = String(value).toLowerCase();
    let match = null;

    if (field === "rider_id") {
      match = riders.find(r => String(r.rider_id) === String(value));
    } else if (field === "id_number") {
      match = riders.find(r => r.id_number && r.id_number.toLowerCase() === v);
    } else if (field === "box_serial_number") {
      match = riders.find(r => r.box_serial_number && r.box_serial_number.toLowerCase() === v);
    } else if (field === "first_name") {
      match = riders.find(r => r.first_name && r.first_name.toLowerCase() === v);
    } else if (field === "first_last_name") {
      match = riders.find(r => r.first_last_name && r.first_last_name.toLowerCase() === v);
    } else if (field === "plate_number") {
      match = riders.find(r => r.plate_number && r.plate_number.toLowerCase() === v);
    }

    if (match) {
      setForm(prev => ({
        ...prev,
        rider_id: match.rider_id || "",
        id_number: match.id_number || "",
        first_name: match.first_name || "",
        first_last_name: match.first_last_name || "",
        box_serial_number: match.box_serial_number || "",
        plate_number: match.plate_number || "",
      }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    if (["rider_id", "id_number", "box_serial_number", "plate_number", "first_name", "first_last_name"].includes(name)) {
      autofillByField(name, value);
    }
  }

  function handleChange(e) {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm(prev => ({ ...prev, image: files?.[0] || null }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude},${pos.coords.longitude}`;
        setForm(prev => ({ ...prev, location: loc }));
        setGettingLocation(false);
        setError("");
      },
      (err) => {
        setError(`Failed to get location: ${err?.message || "Unknown error"}`);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Make location mandatory
    if (!form.location) {
      setError("Veuillez fournir la localisation.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "image") {
          if (v) data.append("image", v);
        } else {
          data.append(k, v ?? "");
        }
      });
      data.append("inspected_by", inspected_by || "");

      const res = await authAxios.post(
        "https://employee-inspection-backend.onrender.com/inspections",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Submit OK:", res.status, res.data);
      setSuccess("Inspection soumise !");
      setForm({
        rider_id: "",
        id_number: "",
        first_name: "",
        first_last_name: "",
        mfc_location: "",
        box_serial_number: "",
        plate_number: "",
        city: "",
        location: "",
        helmet: "",
        box: "",
        account: "",
        parking: "",
        appearance: "",
        driving: "",
        mfc_status: "",
        courier_behavior: "",
        image: null,
        comments: "",
      });
    } catch (err) {
      console.error("Submit error:", err);
      const detail = err?.response?.data?.detail;
      let message = "Échec de la soumission du contrôle.";
      if (Array.isArray(detail)) {
        message = detail.map(d => d?.msg || "").filter(Boolean).join(" • ");
      } else if (typeof detail === "string") {
        message = detail;
      } else if (err?.message) {
        message = err.message;
      }
      // Force a string so React doesn't crash
      setError(String(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormErrorBoundary>
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          width: "100vw",
          bgcolor: "#eef2fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2, sm: 5 },
            borderRadius: 4,
            bgcolor: "#f5f7fa",
            maxWidth: 700,
            width: "100%",
            minHeight: { xs: "auto", md: 600 },
            mx: 2,
          }}
        >
          <Typography variant="h4" fontWeight="bold" align="center" gutterBottom sx={{ color: "#17417e" }}>
            Ajouter un nouveau contrôle
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Remplissez le formulaire. Les champs marqués comme (optionnel) peuvent être laissés vides.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              const tag = e.target.tagName.toLowerCase();
              const type = e.target.type;
              if (e.key === "Enter" && tag !== "textarea" && type !== "submit") {
                e.preventDefault();
              }
            }}
            encType="multipart/form-data"
          >
            <Stack spacing={3}>
              {Boolean(error) && <Alert severity="error">{String(error)}</Alert>}
              {Boolean(success) && <Alert severity="success">{String(success)}</Alert>}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Rider ID" name="rider_id" value={form.rider_id} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. 123" fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Numéro de série de la Box" name="box_serial_number" value={form.box_serial_number} onChange={handleChange} onBlur={handleBlur} placeholder="Box Serial Number" fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Numéro d’immatriculation" name="plate_number" value={form.plate_number} onChange={handleChange} onBlur={handleBlur} placeholder="Plate Number" fullWidth size="small" />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField label="CIN" name="id_number" value={form.id_number} onChange={handleChange} onBlur={handleBlur} placeholder="National ID/Other" fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Prénom" name="first_name" value={form.first_name} onChange={handleChange} onBlur={handleBlur} placeholder="First Name" fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Nom de famille" name="first_last_name" value={form.first_last_name} onChange={handleChange} onBlur={handleBlur} placeholder="Last Name" fullWidth size="small" />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                    <InputLabel id="mfc_location-label">MFC</InputLabel>
                    <Select labelId="mfc_location-label" id="mfc_location" name="mfc_location" value={form.mfc_location} label="MFC" onChange={handleChange}>
                      <MenuItem value="OASIS">OASIS</MenuItem>
                      <MenuItem value="YAAKOUB">YAAKOUB</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                    <InputLabel id="city-label">Ville</InputLabel>
                    <Select labelId="city-label" id="city" name="city" value={form.city} label="Ville" onChange={handleChange}>
                      <MenuItem value="" />
                      {[
                        "Agadir","Ben guerir","Beni mellal","Berrechid","Bouskoura","Bouznika","Casablanca","Dakhla","Dar bouazza","El jadida",
                        "Essaouira","Fes","Ifrane","Kenitra","Khemisset","Khouribga","Laayoune","Larache","M'diq","Marrakech","Meknes",
                        "Mohammedia","Nador","Nouacer","Ouarzazate","Oujda","Rabat","Safi","Settat","Tamesna","Tanger","Technopolis","Tetouan"
                      ].map((city) => (
                        <MenuItem key={city} value={city}>{city}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={12}>
                  <Box display="flex" alignItems="center">
                    <TextField
                      label="Emplacement"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Location or coordinates"
                      fullWidth
                      size="small"
                      required
                    />
                    <Button
                      startIcon={<LocationOnIcon />}
                      variant="outlined"
                      sx={{ ml: 4, minWidth: 180, whiteSpace: "nowrap" }}
                      onClick={handleUseLocation}
                      disabled={gettingLocation || submitting}
                    >
                      {gettingLocation ? <CircularProgress size={18} sx={{ mr: 1 }} /> : "Ma localisation"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Box sx={{ width: "100%" }}>
                <Typography variant="subtitle1" sx={{ color: "#17417e", mt: 1, mb: 1 }}>
                  Détails du contrôle
                </Typography>
                <Stack spacing={2}>
                  {[
                    { id: "helmet", label: "Porte un Casque", items: ["Non Contrôlé","Oui","Non"] },
                    { id: "box", label: "Box", items: ["Bon état","Mauvais état","N'a pas de box"] },
                    { id: "account", label: "Compte Glovo", items: ["Non Vérifié","Vérifié et Validé","Compte loué","A refusé de fournir les informations"] },
                    { id: "parking", label: "Emplacement de stationnement", items: ["Non Vérifié","Stationement dans une zone dédiée","Stationement Interdit"] },
                    { id: "appearance", label: "Apparence", items: ["Non Vérifié","Tenue correcte avec gilet Glovo","Tenue correcte sans gilet Glovo","Tenue non correcte: Porte un pyjama, des sandales, des sabots, etc."] },
                    { id: "driving", label: "Conduite", items: ["Non Vérifié","Conduite dangereuse","Excès de vitesse","Conduite en sens interdit","Bonne conduite"] },
                    { id: "mfc_status", label: "Glovo Market", items: ["Non Vérifié","Commande en cours","Attente sans commande en cours"] },
                    { id: "courier_behavior", label: "Comportement du coursier", items: ["Collaboratif","Non Collaboratif"] },
                  ].map(sel => (
                    <FormControl key={sel.id} fullWidth size="small">
                      <InputLabel id={`${sel.id}-label`}>{sel.label}</InputLabel>
                      <Select
                        labelId={`${sel.id}-label`}
                        id={sel.id}
                        name={sel.id}
                        value={form[sel.id]}
                        label={sel.label}
                        onChange={handleChange}
                      >
                        {sel.items.map(it => <MenuItem key={it} value={it}>{it}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </Box>

              <Divider />

              <Button component="label" variant="outlined" startIcon={<ImageIcon />}>
                {form.image ? "Change Image" : "Ajouter une image (optionnel)"}
                <input type="file" name="image" accept="image/*" hidden onChange={handleChange} />
              </Button>

              <TextField
                label="Commentaire"
                name="comments"
                value={form.comments}
                onChange={handleChange}
                placeholder="Saisissez ici vos commentaires ou observations"
                fullWidth
                size="small"
                multiline
                minRows={3}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                size="large"
                sx={{ mt: 2, boxShadow: 2, bgcolor: "#17417e", ":hover": { bgcolor: "#122e57" } }}
              >
                {submitting ? <CircularProgress size={22} /> : "Valider le contrôle"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </FormErrorBoundary>
  );
}