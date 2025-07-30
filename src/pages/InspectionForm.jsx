import React, { useState } from "react";
import axios from "axios";
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

  const token = localStorage.getItem("token");
  let inspected_by = "";

  try {
    inspected_by = jwtDecode(token).sub;
  } catch {
    inspected_by = "";
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
                  label="Rider ID (optional)"
                  name="rider_id"
                  value={form.rider_id}
                  onChange={handleChange}
                  placeholder="e.g. 123"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Box Serial Number"
                  name="box_serial_number"
                  value={form.box_serial_number}
                  onChange={handleChange}
                  placeholder="Box Serial Number"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Plate Number"
                  name="plate_number"
                  value={form.plate_number}
                  onChange={handleChange}
                  placeholder="Plate Number"
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
            <Typography variant="subtitle1" sx={{ color: "#17417e", mt: 1 }}>
              Inspection Details
            </Typography>
            <Grid container spacing={2}>
  {[
    { key: "helmet", label: "Helmet", options: dropdownOptions.helmet },
    { key: "box", label: "Box", options: dropdownOptions.box },
    { key: "account", label: "Account", options: dropdownOptions.account },
    { key: "parking", label: "Parking", options: dropdownOptions.parking },
    { key: "appearance", label: "Appearance", options: dropdownOptions.appearance },
    { key: "driving", label: "Driving", options: dropdownOptions.driving },
    { key: "mfc_status", label: "MFC Status", options: dropdownOptions.mfc_status },
    { key: "courier_behavior", label: "Courier Behavior", options: dropdownOptions.courier_behavior },
  ].map(({ key, label, options }) => (
    <Grid item xs={12} key={key}>  {/* <-- Each dropdown full row */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id={`${key}-label`}>{label}</InputLabel>
        <Select
          labelId={`${key}-label`}
          id={key}
          name={key}
          value={form[key]}
          label={label}
          onChange={handleChange}
        >
          <MenuItem value="" />
          {options.map((opt) => (
            <MenuItem value={opt} key={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  ))}
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