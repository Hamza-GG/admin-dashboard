import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios"; // instead of axios
import { jwtDecode } from "jwt-decode";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Divider,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
/*
const dropdownOptions = {
  helmet: ["Yes", "No"],
  box: ["Clean", "Dirty or torn", "Does not have a box"],
  account: ["Valid", "Rented", "Refused to provide account or CIN."],
  parking: [
    "Valid - in a dedicated area",
    "Not valid - in a prohibited area",
  ],
  appearance: [
    "Valid - Decent attire with gilet",
    "Valid - Decent attire sans gilet",
    "Not valid - wearing pyjama, Sandals, sabots etc",
  ],
  driving: [
    "Reckless driving",
    "Overspeed",
    "One way driving",
    "Good Behavior",
  ],
  mfc_status: [
    "Ongoing order - waiting for pick up",
    "Not ongoing order - waiting for new order",
  ],
  courier_behavior: [
    "Valid - Collaborative, respectful",
    "Not valid - Not collaborative",
  ],
};
*/
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

  // Rider data for auto-fill
  const [riders, setRiders] = useState([]);
  const token = localStorage.getItem("token");
  let inspected_by = "";
  try {
    inspected_by = jwtDecode(token).sub;
  } catch {
    inspected_by = "";
  }

  // Fetch riders once on mount
  useEffect(() => {
    async function fetchRiders() {
      try {
        const res = await authAxios.get("https://employee-inspection-backend.onrender.com/riders");
        setRiders(res.data || []);
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchRiders();
  }, [token]);

  // Lookup function for any field
  function autofillByField(field, value) {
    if (!value) return;
    let match = null;
    if (field === "rider_id") {
      match = riders.find((r) => r.rider_id && r.rider_id.toString() === value.toString());
    } else if (field === "id_number") {
      match = riders.find((r) => r.id_number && r.id_number.toLowerCase() === value.toLowerCase());
    } else if (field === "box_serial_number") {
      match = riders.find((r) => r.box_serial_number && r.box_serial_number.toLowerCase() === value.toLowerCase());
    
    } 
      else if (field === "first_name") {
  match = riders.find((r) => r.first_name?.toLowerCase() === value.toLowerCase());
} else if (field === "first_last_name") {
  match = riders.find((r) => r.first_last_name?.toLowerCase() === value.toLowerCase());
}
    else if (field === "plate_number") {
      match = riders.find((r) => r.plate_number && r.plate_number.toLowerCase() === value.toLowerCase());
    }
    if (match) {
      setForm((prev) => ({
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

  // OnBlur handler for the auto-fill fields
  function handleBlur(e) {
    const { name, value } = e.target;
    if (["rider_id", "id_number", "box_serial_number", "plate_number"].includes(name)) {
      autofillByField(name, value);
    }
  }

  function handleChange(e) {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = `${position.coords.latitude},${position.coords.longitude}`;
        setForm((prev) => ({ ...prev, location: loc }));
        setGettingLocation(false);
        setError("");
      },
      (error) => {
        setError("Failed to get location: " + error.message);
        setGettingLocation(false);
      }
    );
  }

async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setSuccess("");

  // Require location
  if (!form.location) {
    setError("Veuillez fournir la localisation.");
    return;
  }

  setSubmitting(true);
  try {
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "image" && v) {
        data.append("image", v);
      } else {
        data.append(k, v ?? ""); // ensure strings, not undefined
      }
    });

    // inspected_by is ignored by backend, but harmless
    data.append("inspected_by", inspected_by || "");

    await authAxios.post(
      "https://employee-inspection-backend.onrender.com/inspections",
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

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
    // Normalize error to a string to avoid React crashing
    const detail = err?.response?.data?.detail;
    let message = "Échec de la soumission du contrôle.";
    if (Array.isArray(detail)) {
      // FastAPI validation errors
      message = detail.map(d => d?.msg || "").filter(Boolean).join(" • ");
    } else if (typeof detail === "string") {
      message = detail;
    } else if (err?.message) {
      message = err.message;
    }
    setError(message);
    console.error("Submit error:", err);
  } finally {
    setSubmitting(false);
  }
}

  return (
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
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          gutterBottom
          sx={{ color: "#17417e" }}
        >
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

    // Prevent Enter key in inputs that are not multiline or buttons
    if (e.key === "Enter" && tag !== "textarea" && type !== "submit") {
      e.preventDefault();
    }
  }}
  encType="multipart/form-data"
>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Rider ID"
                  name="rider_id"
                  value={form.rider_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 123"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Numéro de série de la Box"
                  name="box_serial_number"
                  value={form.box_serial_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Box Serial Number"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Numéro d’immatriculation"
                  name="plate_number"
                  value={form.plate_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Plate Number"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CIN"
                  name="id_number"
                  value={form.id_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="National ID/Other"
                  fullWidth
                  size="small"
                />
              </Grid>
                
            <Grid item xs={12} sm={6}>
  <TextField
    label="Prénom"
    name="first_name"
    value={form.first_name}
    onChange={handleChange}
    onBlur={handleBlur}
    placeholder="First Name"
    fullWidth
    size="small"
  />
</Grid>
<Grid item xs={12} sm={6}>
  <TextField
    label="Nom de famille"
    name="first_last_name"
    value={form.first_last_name}
    onChange={handleChange}
    onBlur={handleBlur}
    placeholder="Last Name"
    fullWidth
    size="small"
  />
</Grid>
<Grid item xs={12} sm={6}>
  <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
    <InputLabel id="mfc_location-label">MFC</InputLabel>
    <Select
      labelId="mfc_location-label"
      id="mfc_location"
      name="mfc_location"
      value={form.mfc_location}
      label="MFC"
      onChange={handleChange}
    >
      <MenuItem value="OASIS">OASIS</MenuItem>
      <MenuItem value="YAAKOUB">YAAKOUB</MenuItem>
    </Select>
  </FormControl>
</Grid>
          
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                  <InputLabel id="city-label">Ville</InputLabel>
                  <Select
                    labelId="city-label"
                    id="city"
                    name="city"
                    value={form.city}
                    label="Ville"
                    onChange={handleChange}
                    //displayEmpty
                  >
                    <MenuItem value="" />
                    {[
                      "Agadir", "Ben guerir", "Beni mellal", "Berrechid", "Bouskoura",
                      "Bouznika", "Casablanca", "Dakhla", "Dar bouazza", "El jadida",
                      "Essaouira", "Fes", "Ifrane", "Kenitra", "Khemisset", "Khouribga",
                      "Laayoune", "Larache", "M'diq", "Marrakech", "Meknes", "Mohammedia",
                      "Nador", "Nouacer", "Ouarzazate", "Oujda", "Rabat", "Safi", "Settat",
                      "Tamesna", "Tanger", "Technopolis", "Tetouan"
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
                  />
                  <Button
                    startIcon={<LocationOnIcon />}
                    variant="outlined"
                    sx={{ ml: 4, minWidth: 180, whiteSpace: "nowrap" }}
                    onClick={handleUseLocation}
                    disabled={gettingLocation || submitting}
                  >
                    {gettingLocation ? (
                      <CircularProgress size={18} sx={{ mr: 1 }} />
                    ) : (
                      "Ma localisation"
                    )}
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
    <FormControl fullWidth size="small">
      <InputLabel id="helmet-label">Porte un Casque</InputLabel>
      <Select
        labelId="helmet-label"
        id="helmet"
        name="helmet"
        value={form.helmet}
        label="Porte un Casque"
        onChange={handleChange}
      >
        <MenuItem value="Non Contrôlé">Non Contrôlé</MenuItem>
        <MenuItem value="Oui">Oui</MenuItem>
        <MenuItem value="Non">Non</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="box-label">Box</InputLabel>
      <Select
        labelId="box-label"
        id="box"
        name="box"
        value={form.box}
        label="Box"
        onChange={handleChange}
      >
        <MenuItem value="Bon état">Bon état</MenuItem>
        <MenuItem value="Mauvais état">Mauvais état</MenuItem>
        <MenuItem value="N'a pas de box">N'a pas de box</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="account-label">Compte Glovo</InputLabel>
      <Select
        labelId="account-label"
        id="account"
        name="account"
        value={form.account}
        label="Compte Glovo"
        onChange={handleChange}
      >
        <MenuItem value="Non Vérifié">Non Vérifié</MenuItem>
        <MenuItem value="Vérifié et Validé">Vérifié et Validé</MenuItem>
        <MenuItem value="Compte loué">Compte loué</MenuItem>
        <MenuItem value="A refusé de fournir les informations">A refusé de fournir les informations</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="parking-label">Emplacement de stationnement</InputLabel>
      <Select
        labelId="parking-label"
        id="parking"
        name="parking"
        value={form.parking}
        label="Emplacement de stationnement"
        onChange={handleChange}
      >
        <MenuItem value="Non Vérifié">Non Vérifié</MenuItem>
        <MenuItem value="Stationement dans une zone dédiée">Stationement dans une zone dédiée</MenuItem>
        <MenuItem value="Stationement Interdit">Stationement Interdit</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="appearance-label">Apparence</InputLabel>
      <Select
        labelId="appearance-label"
        id="appearance"
        name="appearance"
        value={form.appearance}
        label="Apparence"
        onChange={handleChange}
      >
        <MenuItem value="Non Vérifié">Non Vérifié</MenuItem>
        <MenuItem value="Tenue correcte avec gilet Glovo">Tenue correcte avec gilet Glovo</MenuItem>
        <MenuItem value="Tenue correcte sans gilet Glovo">Tenue correcte sans gilet Glovo</MenuItem>
        <MenuItem value="Tenue non correcte: Porte un pyjama, des sandales, des sabots, etc.">Tenue non correcte: Porte un pyjama, des sandales, des sabots, etc.</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="driving-label">Conduite</InputLabel>
      <Select
        labelId="driving-label"
        id="driving"
        name="driving"
        value={form.driving}
        label="Conduite"
        onChange={handleChange}
      >
        <MenuItem value="Non Vérifié">Non Vérifié</MenuItem>
        <MenuItem value="Conduite dangereuse">Conduite dangereuse</MenuItem>
        <MenuItem value="Excès de vitesse">Excès de vitesse</MenuItem>
        <MenuItem value="Conduite en sens interdit">Conduite en sens interdit</MenuItem>
        <MenuItem value="Bonne conduite">Bonne conduite</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="mfc_status-label">Glovo Market</InputLabel>
      <Select
        labelId="mfc_status-label"
        id="mfc_status"
        name="mfc_status"
        value={form.mfc_status}
        label="Glovo Market"
        onChange={handleChange}
      >
        <MenuItem value="Non Vérifié">Non Vérifié</MenuItem>
        <MenuItem value="Commande en cours">Commande en cours</MenuItem>
        <MenuItem value="Attente sans commande en cours">Attente sans commande en cours</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="courier_behavior-label">Comportement du coursier</InputLabel>
      <Select
        labelId="courier_behavior-label"
        id="courier_behavior"
        name="courier_behavior"
        value={form.courier_behavior}
        label="Comportement du coursier"
        onChange={handleChange}
      >
        <MenuItem value="Collaboratif">Collaboratif</MenuItem>
        <MenuItem value="Non Collaboratif">Non Collaboratif</MenuItem>
      </Select>
    </FormControl>
  </Stack>
</Box>

            <Divider />
            <Button
              component="label"
              variant="outlined"
              startIcon={<ImageIcon />}
            >
              {form.image ? "Change Image" : "Ajouter une image (optionnel)"}
              <input
                type="file"
                name="image"
                accept="image/*"
                hidden
                onChange={handleChange}
              />
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
              sx={{
                mt: 2,
                boxShadow: 2,
                bgcolor: "#17417e",
                ":hover": { bgcolor: "#122e57" }
              }}
            >
              {submitting ? <CircularProgress size={22} /> : "Valider le contrôle"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}