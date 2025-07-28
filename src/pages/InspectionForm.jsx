import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Divider,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";

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

  const token = localStorage.getItem("token");
  let inspected_by = "";

  try {
    inspected_by = jwtDecode(token).sub;
  } catch {
    inspected_by = "";
  }

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
      data.append("inspected_by", inspected_by);

      await axios.post("https://employee-inspection-backend.onrender.com/inspections", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
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
        minHeight: "calc(100vh - 64px)", // adjust 64px to match your navbar height if needed
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Rider ID (optional)"
                  name="rider_id"
                  value={form.rider_id}
                  onChange={handleChange}
                  placeholder="e.g. 123"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Rider ID Number (optional)"
                  name="id_number"
                  value={form.id_number}
                  onChange={handleChange}
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
  label="City"
  onChange={handleChange}
  displayEmpty
>
  <MenuItem value="">
  </MenuItem>
  <MenuItem value="Agadir">Agadir</MenuItem>
  <MenuItem value="Ben guerir">Ben guerir</MenuItem>
  <MenuItem value="Beni mellal">Beni mellal</MenuItem>
  <MenuItem value="Berrechid">Berrechid</MenuItem>
  <MenuItem value="Bouskoura">Bouskoura</MenuItem>
  <MenuItem value="Bouznika">Bouznika</MenuItem>
  <MenuItem value="Casablanca">Casablanca</MenuItem>
  <MenuItem value="Dakhla">Dakhla</MenuItem>
  <MenuItem value="Dar bouazza">Dar bouazza</MenuItem>
  <MenuItem value="El jadida">El jadida</MenuItem>
  <MenuItem value="Essaouira">Essaouira</MenuItem>
  <MenuItem value="Fes">Fes</MenuItem>
  <MenuItem value="Ifrane">Ifrane</MenuItem>
  <MenuItem value="Kenitra">Kenitra</MenuItem>
  <MenuItem value="Khemisset">Khemisset</MenuItem>
  <MenuItem value="Khouribga">Khouribga</MenuItem>
  <MenuItem value="Laayoune">Laayoune</MenuItem>
  <MenuItem value="Larache">Larache</MenuItem>
  <MenuItem value="M'diq">M'diq</MenuItem>
  <MenuItem value="Marrakech">Marrakech</MenuItem>
  <MenuItem value="Meknes">Meknes</MenuItem>
  <MenuItem value="Mohammedia">Mohammedia</MenuItem>
  <MenuItem value="Nador">Nador</MenuItem>
  <MenuItem value="Nouacer">Nouacer</MenuItem>
  <MenuItem value="Ouarzazate">Ouarzazate</MenuItem>
  <MenuItem value="Oujda">Oujda</MenuItem>
  <MenuItem value="Rabat">Rabat</MenuItem>
  <MenuItem value="Safi">Safi</MenuItem>
  <MenuItem value="Settat">Settat</MenuItem>
  <MenuItem value="Tamesna">Tamesna</MenuItem>
  <MenuItem value="Tanger">Tanger</MenuItem>
  <MenuItem value="Technopolis">Technopolis</MenuItem>
  <MenuItem value="Tetouan">Tetouan</MenuItem>
</Select>
  </FormControl>
</Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <TextField
                    label="Location (describe if no rider ID, e.g. store, street...)"
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
  sx={{ ml: 4, minWidth: 180, whiteSpace: "nowrap" }}  // <-- more space!
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
            <Typography variant="subtitle1" sx={{ color: "#17417e", mt: 1 }}>
              Inspection Checklist
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="helmet_ok"
                      checked={form.helmet_ok}
                      onChange={handleChange}
                    />
                  }
                  label="Helmet OK"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="box_ok"
                      checked={form.box_ok}
                      onChange={handleChange}
                    />
                  }
                  label="Box OK"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="id_ok"
                      checked={form.id_ok}
                      onChange={handleChange}
                    />
                  }
                  label="ID OK"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="zone_ok"
                      checked={form.zone_ok}
                      onChange={handleChange}
                    />
                  }
                  label="Zone OK"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="clothes_ok"
                      checked={form.clothes_ok}
                      onChange={handleChange}
                    />
                  }
                  label="Clothes OK"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="well_behaved"
                      checked={form.well_behaved}
                      onChange={handleChange}
                    />
                  }
                  label="Well Behaved"
                />
              </Grid>
            </Grid>
            <Divider />
            <Button
              component="label"
              variant="outlined"
              startIcon={<ImageIcon />}
            >
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
              {submitting ? <CircularProgress size={22} /> : "Submit Inspection"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
