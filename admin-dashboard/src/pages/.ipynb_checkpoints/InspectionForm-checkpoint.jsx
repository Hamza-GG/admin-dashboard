import React, { useState } from "react";
import {
  Select, MenuItem, InputLabel, FormControl,
  Box, Typography, TextField, Button, Checkbox, FormControlLabel,
  Paper, Alert, CircularProgress, Stack, Grid, Divider
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import { fetchWithAutoRefresh } from "../utils/api"; // ✅ import helper

export default function InspectionForm() {
  const [form, setForm] = useState({
    rider_id: "",
    id_number: "",
    city: "",
    location: "",
    helmet_ok: false,
    box_ok: false,
    id_ok: false,
    zone_ok: false,
    clothes_ok: false,
    well_behaved: false,
    image: null,
    comments: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
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

      const res = await fetchWithAutoRefresh("/inspections", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.detail || "Failed to submit inspection.");
      }

      setSuccess("Inspection submitted!");
      setForm({
        rider_id: "",
        id_number: "",
        city: "",
        location: "",
        helmet_ok: false,
        box_ok: false,
        id_ok: false,
        zone_ok: false,
        clothes_ok: false,
        well_behaved: false,
        image: null,
        comments: "",
      });
    } catch (err) {
      setError(err.message || "Failed to submit inspection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "calc(100vh - 64px)",
      width: "100vw",
      bgcolor: "#eef2fa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      py: { xs: 2, md: 4 },
    }}>
      <Paper elevation={6} sx={{
        p: { xs: 2, sm: 5 },
        borderRadius: 4,
        bgcolor: "#f5f7fa",
        maxWidth: 700,
        width: "100%",
        minHeight: { xs: "auto", md: 600 },
        mx: 2,
      }}>
        <Typography variant="h4" fontWeight="bold" align="center" gutterBottom sx={{ color: "#17417e" }}>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Rider ID (optional)"
                  name="rider_id"
                  value={form.rider_id}
                  onChange={handleChange}
                  placeholder="e.g. 123"
                  fullWidth size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Rider ID Number (optional)"
                  name="id_number"
                  value={form.id_number}
                  onChange={handleChange}
                  placeholder="National ID/Other"
                  fullWidth size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="city-label">City</InputLabel>
                  <Select
                    labelId="city-label"
                    id="city"
                    name="city"
                    value={form.city}
                    label="City"
                    onChange={handleChange}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
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

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <TextField
                    label="Location (describe or coords)"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    fullWidth size="small"
                  />
                  <Button
                    startIcon={<LocationOnIcon />}
                    variant="outlined"
                    sx={{ ml: 4, minWidth: 180, whiteSpace: "nowrap" }}
                    onClick={handleUseLocation}
                    disabled={gettingLocation || submitting}
                  >
                    {gettingLocation ? <CircularProgress size={18} sx={{ mr: 1 }} /> : "Use my location"}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle1" sx={{ color: "#17417e", mt: 1 }}>
              Inspection Checklist
            </Typography>
            <Grid container spacing={2}>
              {[
                ["helmet_ok", "Helmet OK"],
                ["box_ok", "Box OK"],
                ["id_ok", "ID OK"],
                ["zone_ok", "Zone OK"],
                ["clothes_ok", "Clothes OK"],
                ["well_behaved", "Well Behaved"]
              ].map(([name, label]) => (
                <Grid item xs={6} sm={4} key={name}>
                  <FormControlLabel
                    control={<Checkbox name={name} checked={form[name]} onChange={handleChange} />}
                    label={label}
                  />
                </Grid>
              ))}
            </Grid>

            <Button component="label" variant="outlined" startIcon={<ImageIcon />}>
              {form.image ? "Change Image" : "Upload Image (optional)"}
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
              placeholder="Enter any comments or observations here"
              fullWidth size="small" multiline minRows={3}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              size="large"
              sx={{ mt: 2, boxShadow: 2, bgcolor: "#17417e", ":hover": { bgcolor: "#122e57" } }}
            >
              {submitting ? <CircularProgress size={22} /> : "Submit Inspection"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}