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

export default function InspectionForm() {
  const [form, setForm] = useState({
    rider_id: "",
    id_number: "",
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
    } else if (field === "plate_number") {
      match = riders.find((r) => r.plate_number && r.plate_number.toLowerCase() === value.toLowerCase());
    }
    if (match) {
      setForm((prev) => ({
        ...prev,
        rider_id: match.rider_id || "",
        id_number: match.id_number || "",
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
    if (!form.rider_id && !form.id_number && !form.location) {
      setError("Please provide at least Rider ID, ID Number, or Location.");
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if ((k === "rider_id" || k === "id_number") && !v) {
          data.append(k, "");
        } else if (k === "image" && v) {
          data.append("image", v);
        } else if (k !== "image") {
          data.append(k, v);
        }
      });
      data.append("inspected_by", inspected_by);

     await authAxios.post("https://employee-inspection-backend.onrender.com/inspections", data, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
        
      setSuccess("Inspection submitted!");
      setForm({
        rider_id: "",
        id_number: "",
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
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Failed to submit inspection.");
      }
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
          Add New Inspection
        </Typography>
        <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
          Fill out the details of the inspection. Fields marked as (optional) can be left blank.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                  <InputLabel id="city-label">City</InputLabel>
                  <Select
                    labelId="city-label"
                    id="city"
                    name="city"
                    value={form.city}
                    label="Ville"
                    onChange={handleChange}
                    displayEmpty
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
                      "Use my location"
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
            <Divider />
            
            <Box sx={{ width: "100%" }}>
  <Typography variant="subtitle1" sx={{ color: "#17417e", mt: 1, mb: 1 }}>
    Inspection Details
  </Typography>
  <Stack spacing={2}>
    <FormControl fullWidth size="small">
      <InputLabel id="helmet-label">Helmet</InputLabel>
      <Select
        labelId="helmet-label"
        id="helmet"
        name="helmet"
        value={form.helmet}
        label="Casque"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Yes">Yes</MenuItem>
        <MenuItem value="No">No</MenuItem>
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
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Clean">Clean</MenuItem>
        <MenuItem value="Dirty or torn">Dirty or torn</MenuItem>
        <MenuItem value="Does not have a box">Does not have a box</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="account-label">Account</InputLabel>
      <Select
        labelId="account-label"
        id="account"
        name="account"
        value={form.account}
        label="Compte Glovo"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Valid">Valid</MenuItem>
        <MenuItem value="Rented">Rented</MenuItem>
        <MenuItem value="Refused to provide account or CIN.">Refused to provide account or CIN.</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="parking-label">Parking</InputLabel>
      <Select
        labelId="parking-label"
        id="parking"
        name="parking"
        value={form.parking}
        label="Emplacement de stationnement"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Valid - in a dedicated area">Valid - in a dedicated area</MenuItem>
        <MenuItem value="Not valid - in a prohibited area">Not valid - in a prohibited area</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="appearance-label">Appearance</InputLabel>
      <Select
        labelId="appearance-label"
        id="appearance"
        name="appearance"
        value={form.appearance}
        label="Apparence"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Valid - Decent attire with gilet">Valid - Decent attire with gilet</MenuItem>
        <MenuItem value="Valid - Decent attire sans gilet">Valid - Decent attire sans gilet</MenuItem>
        <MenuItem value="Not valid - wearing pyjama, Sandals, sabots etc">Not valid - wearing pyjama, Sandals, sabots etc</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="driving-label">Driving</InputLabel>
      <Select
        labelId="driving-label"
        id="driving"
        name="driving"
        value={form.driving}
        label="Conduite"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Reckless driving">Reckless driving</MenuItem>
        <MenuItem value="Overspeed">Overspeed</MenuItem>
        <MenuItem value="One way driving">One way driving</MenuItem>
        <MenuItem value="Good Behavior">Good Behavior</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="mfc_status-label">MFC Status</InputLabel>
      <Select
        labelId="mfc_status-label"
        id="mfc_status"
        name="mfc_status"
        value={form.mfc_status}
        label="MFC"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Ongoing order - waiting for pick up">Ongoing order - waiting for pick up</MenuItem>
        <MenuItem value="Not ongoing order - waiting for new order">Not ongoing order - waiting for new order</MenuItem>
      </Select>
    </FormControl>
    <FormControl fullWidth size="small">
      <InputLabel id="courier_behavior-label">Courier Behavior</InputLabel>
      <Select
        labelId="courier_behavior-label"
        id="courier_behavior"
        name="courier_behavior"
        value={form.courier_behavior}
        label="Comportement du coursier"
        onChange={handleChange}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Valid - Collaborative, respectful">Valid - Collaborative, respectful</MenuItem>
        <MenuItem value="Not valid - Not collaborative">Not valid - Not collaborative</MenuItem>
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
              label="Comments"
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
              {submitting ? <CircularProgress size={22} /> : "Valider l’inspection"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}