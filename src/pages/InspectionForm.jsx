import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios";
import { jwtDecode } from "jwt-decode";
import {
  Select, MenuItem, InputLabel, FormControl,
  Box, Typography, TextField, Button, Paper, Alert,
  CircularProgress, Stack, Grid, Divider,
  Checkbox, ListItemText
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [form, setForm] = useState({
    // Common
    city: "",
    location: "",

    // Rider base fields
    rider_id: "",
    id_number: "",
    first_name: "",
    first_last_name: "",
    box_serial_number: "",
    plate_number: "",
    phone_number: "",

    // Partner base fields
    partner_name: "",

    // Supervisor base fields
    supervisor_email: "",

    image: null,
    comments: "",

    // Dynamic/custom fields
    custom_fields: {},
  });

  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [riders, setRiders] = useState([]);
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [selectedForm, setSelectedForm] = useState(null);
  const [supervisors, setSupervisors] = useState([]);

  const rawToken =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    "";

  const token = String(rawToken).startsWith("Bearer ")
    ? String(rawToken).slice("Bearer ".length)
    : String(rawToken);

  let userRole = "";
  let userEmail = "";
  try {
    const decoded = jwtDecode(token || "") || {};
    userRole = decoded?.role || decoded?.user_role || decoded?.user_type || localStorage.getItem("role") || "";
    userEmail = decoded?.email || decoded?.username || decoded?.user_email || "";
  } catch {
    userRole = localStorage.getItem("role") || "";
    userEmail = "";
  }
  // Debug: verify role parsing
  // console.log("Decoded role:", userRole, "email:", userEmail);

  function normalizeSchemaFields(schema) {
    const raw = schema?.fields ?? schema;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.fields) ? raw.fields : [];
  }

  // Riders (used for Rider autofill)
  useEffect(() => {
    async function fetchRiders() {
      try {
        const res = await authAxios.get(`/riders`);
        setRiders(res.data || []);
      } catch (e) {
        console.warn("Failed to fetch riders", e);
      }
    }
    fetchRiders();
  }, [token]);

  // Forms list
  useEffect(() => {
    async function fetchForms() {
      const role = String(userRole || "").toLowerCase().trim();

      try {
        // Supervisors: ONLY assigned forms
        if (role === "supervisor") {
          const assignedRes = await authAxios.get(`/forms/assigned`);
          setForms(Array.isArray(assignedRes.data) ? assignedRes.data : []);
          return;
        }

        // Admin + User: list all active forms via /me/forms (backend allows both)
        const meRes = await authAxios.get(`/me/forms`);
        setForms(Array.isArray(meRes.data) ? meRes.data : []);
      } catch (e) {
        console.warn("Failed to fetch forms", e);

        // Keep empty list; don't fall back to /forms because it's admin-only in most setups.
        setForms([]);
      }
    }

    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userRole]);

  // Supervisors list (for Supervisor-type base field)
  useEffect(() => {
    async function fetchSupervisors() {
      try {
        const res = await authAxios.get(`/users`);
        const list = Array.isArray(res.data) ? res.data : [];
        const sup = list
          .filter((u) => String(u.role || "").toLowerCase() === "supervisor")
          .map((u) => u.username || u.email)
          .filter(Boolean);
        setSupervisors(sup);
      } catch (e) {
        // Supervisors may not have access to /users; ignore 403.
        if (e?.response?.status !== 403) {
          console.warn("Failed to fetch users", e);
        }
        setSupervisors([]);
      }
    }
    fetchSupervisors();
  }, [token]);

  function handleSelectForm(e) {
    const id = e.target.value;
    setSelectedFormId(id);

    const f = forms.find((x) => String(x.id) === String(id)) || null;
    setSelectedForm(f);

    // Initialize custom_fields for selected form
    const fields = normalizeSchemaFields(f?.schema);
    const initial = {};
    fields.forEach((fld) => {
      const key = fld?.id;
      if (!key) return;
      const multi = Boolean(fld?.multi);
      if (multi) {
        initial[String(key)] = [];
      } else {
        initial[String(key)] = "";
      }
    });

    setForm((prev) => ({
      ...prev,
      custom_fields: initial,
    }));
  }

  function handleCustomChange(fieldId, value) {
    setForm((prev) => ({
      ...prev,
      custom_fields: {
        ...(prev.custom_fields || {}),
        [String(fieldId)]: value,
      },
    }));
  }

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
        phone_number: match.phone_number || "",
        city: match.city_code || "",
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
      setError(t("inspectionForm.geoNotSupported"));
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
        setError(`${t("inspectionForm.geoFailedPrefix")} ${err?.message || t("common.unknownError")}`);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedForm) {
      setError(t("inspectionForm.selectFormError"));
      return;
    }

    // Make location mandatory
    if (!form.location) {
      setError(t("inspectionForm.locationRequiredError"));
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        if (k === "image") {
          if (v) data.append("image", v);
          return;
        }
        if (k === "custom_fields") {
          data.append("custom_fields", JSON.stringify(v || {}));
          return;
        }
        data.append(k, v ?? "");
      });

      data.append("form_id", String(selectedForm.id));

      const res = await authAxios.post(
        `/inspections`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Submit OK:", res.status, res.data);
      setSuccess(t("inspectionForm.submittedOk"));
      setForm({
        city: "",
        location: "",

        rider_id: "",
        id_number: "",
        first_name: "",
        first_last_name: "",
        box_serial_number: "",
        plate_number: "",
        phone_number: "",

        partner_name: "",
        supervisor_email: "",

        image: null,
        comments: "",
        custom_fields: {},
      });
      setSelectedFormId("");
      setSelectedForm(null);
    } catch (err) {
      console.error("Submit error:", err);
      const detail = err?.response?.data?.detail;
      let message = t("inspectionForm.submitFailed");
      if (Array.isArray(detail)) {
        message = detail.map(d => d?.msg || "").filter(Boolean).join(" • ");
      } else if (typeof detail === "string") {
        message = detail;
      } else if (err?.message) {
        message = err.message;
      }
      setError(String(message));
    } finally {
      setSubmitting(false);
    }
  }

  const CITIES = [
    "Agadir","Ben guerir","Beni mellal","Berrechid","Bouskoura","Bouznika","Casablanca","Dakhla","Dar bouazza","El jadida",
    "Essaouira","Fes","Ifrane","Kenitra","Khemisset","Khouribga","Laayoune","Larache","M'diq","Marrakech","Meknes",
    "Mohammedia","Nador","Nouacer","Ouarzazate","Oujda","Rabat","Safi","Settat","Tamesna","Tanger","Technopolis","Tetouan"
  ];

  const selectedType = String(selectedForm?.type || "").toLowerCase();

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
            {t("inspectionForm.title")}
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            {t("inspectionForm.subtitle")}
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

              {/* Form selector */}
              <FormControl fullWidth size="small">
                <InputLabel id="inspection-form-selector-label">{t("inspectionForm.formLabel")}</InputLabel>
                <Select
                  labelId="inspection-form-selector-label"
                  label={t("inspectionForm.formLabel")}
                  value={selectedFormId}
                  onChange={handleSelectForm}
                >
                  <MenuItem value="">
                    <em>{t("inspectionForm.formPlaceholder")}</em>
                  </MenuItem>
                  {forms.map((f) => (
                    <MenuItem key={f.id} value={String(f.id)}>
                      {f.name} {f.type ? `(${f.type})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Base fields */}
              <Grid container spacing={2}>
                {selectedType === "rider" && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField label={t("inspectionForm.riderId")} name="rider_id" value={form.rider_id} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. 123" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label={t("inspectionForm.boxSerial")} name="box_serial_number" value={form.box_serial_number} onChange={handleChange} onBlur={handleBlur} placeholder="Box Serial Number" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label={t("inspectionForm.plate")} name="plate_number" value={form.plate_number} onChange={handleChange} onBlur={handleBlur} placeholder="Plate Number" fullWidth size="small" />
                    </Grid>

                    {String(userRole).toLowerCase() !== "supervisor" && (
                      <Grid item xs={12} sm={6}>
                        <TextField label={t("inspectionForm.cin")} name="id_number" value={form.id_number} onChange={handleChange} onBlur={handleBlur} placeholder="National ID/Other" fullWidth size="small" />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField label={t("inspectionForm.firstName")} name="first_name" value={form.first_name} onChange={handleChange} onBlur={handleBlur} placeholder="First Name" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label={t("inspectionForm.lastName")} name="first_last_name" value={form.first_last_name} onChange={handleChange} onBlur={handleBlur} placeholder="Last Name" fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Phone Number" fullWidth size="small" />
                    </Grid>
                  </>
                )}

                {selectedType === "partner" && (
                  <Grid item xs={12} sm={6}>
                    <TextField label={t("inspectionForm.partnerName")} name="partner_name" value={form.partner_name} onChange={handleChange} placeholder="Partner" fullWidth size="small" />
                  </Grid>
                )}

                {selectedType === "supervisor" && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                      <InputLabel id="supervisor-email-label">{t("inspectionForm.supervisorLabel")}</InputLabel>
                      <Select
                        labelId="supervisor-email-label"
                        id="supervisor_email"
                        name="supervisor_email"
                        value={form.supervisor_email}
                        label={t("inspectionForm.supervisorLabel")}
                        onChange={handleChange}
                      >
                        <MenuItem value="" />
                        {supervisors.map((email) => (
                          <MenuItem key={email} value={email}>
                            {email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Common city+location once a form is selected */}
                {selectedForm && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                        <InputLabel id="city-label">{t("inspectionForm.cityLabel")}</InputLabel>
                        <Select labelId="city-label" id="city" name="city" value={form.city} label={t("inspectionForm.cityLabel")} onChange={handleChange}>
                          <MenuItem value="" />
                          {form.city && !CITIES.includes(form.city) && (
                            <MenuItem value={form.city}>{form.city}</MenuItem>
                          )}
                          {CITIES.map((city) => (
                            <MenuItem key={city} value={city}>{city}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={12}>
                      <Box display="flex" alignItems="center">
                        <TextField
                          label={t("inspectionForm.locationLabel")}
                          name="location"
                          value={form.location}
                          placeholder="Location or coordinates"
                          fullWidth
                          size="small"
                          required
                          InputProps={{ readOnly: true }}
                        />
                        <Button
                          startIcon={<LocationOnIcon />}
                          variant="outlined"
                          sx={{ ml: 4, minWidth: 180, whiteSpace: "nowrap" }}
                          onClick={handleUseLocation}
                          disabled={gettingLocation || submitting}
                        >
                          {gettingLocation ? <CircularProgress size={18} sx={{ mr: 1 }} /> : t("inspectionForm.locationBtn")}
                        </Button>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>

              {/* Custom fields */}
              {selectedForm && (
                <>
                  <Divider />
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="subtitle1" sx={{ color: "#17417e", mt: 1, mb: 1 }}>
                      {t("inspectionForm.fieldsTitle")}
                    </Typography>
                    <Stack spacing={2}>
                      {normalizeSchemaFields(selectedForm?.schema).map((fld) => {
                        const fid = String(fld?.id || "");
                        if (!fid) return null;
                        const label = fld?.label || fid;
                        const type = String(fld?.type || "text").toLowerCase();
                        const required = Boolean(fld?.required);
                        const value = form?.custom_fields?.[fid];

                        if (type === "select") {
                          const opts = Array.isArray(fld?.options) ? fld.options : [];
                          const multiple = Boolean(fld?.multi);
                          const safeValue = multiple
                            ? (Array.isArray(value) ? value : (value ? [String(value)] : []))
                            : String(value ?? "");

                          return (
                            <FormControl key={fid} fullWidth size="small">
                              <InputLabel id={`${fid}-custom-label`}>{label}</InputLabel>
                              <Select
                                labelId={`${fid}-custom-label`}
                                label={label}
                                value={safeValue}
                                multiple={multiple}
                                MenuProps={multiple ? { disableAutoFocusItem: true } : undefined}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  if (multiple) {
                                    const arr = Array.isArray(next)
                                      ? next
                                      : String(next || "")
                                          .split(",")
                                          .map((s) => s.trim())
                                          .filter(Boolean);
                                    handleCustomChange(fid, arr);
                                  } else {
                                    handleCustomChange(fid, next);
                                  }
                                }}
                                required={required}
                                renderValue={(selected) => {
                                  if (!multiple) return selected || "";
                                  const arr = Array.isArray(selected) ? selected : [];
                                  return arr.join(", ");
                                }}
                              >
                                {!multiple && <MenuItem value="" />}
                                {opts.map((o) => {
                                  const val = String(o);
                                  const checked = multiple && Array.isArray(safeValue) ? safeValue.includes(val) : false;
                                  return (
                                    <MenuItem key={val} value={val}>
                                      {multiple ? (
                                        <>
                                          <Checkbox checked={checked} size="small" />
                                          <ListItemText primary={val} />
                                        </>
                                      ) : (
                                        val
                                      )}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                          );
                        }

                        const isMulti = Boolean(fld?.multi);

                        if (isMulti) {
                          const textValue = Array.isArray(value)
                            ? value.join("\n")
                            : (value ? String(value) : "");

                          return (
                            <TextField
                              key={fid}
                              label={label}
                              value={textValue}
                              onChange={(e) => {
                                const lines = String(e.target.value || "")
                                  .split(/\r?\n/)
                                  .map((s) => s.trim())
                                  .filter((s) => s.length > 0);
                                handleCustomChange(fid, lines);
                              }}
                              fullWidth
                              size="small"
                              required={required}
                              multiline
                              minRows={3}
                              helperText={t("inspectionForm.multiHelp")}
                            />
                          );
                        }

                        return (
                          <TextField
                            key={fid}
                            label={label}
                            value={String(value ?? "")}
                            onChange={(e) => handleCustomChange(fid, e.target.value)}
                            fullWidth
                            size="small"
                            required={required}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                </>
              )}

              <Divider />


              <Button component="label" variant="outlined" startIcon={<ImageIcon />}>
                {form.image ? t("inspectionForm.imageBtnChange") : t("inspectionForm.imageBtnAdd")}
                <input type="file" name="image" accept="image/*" hidden onChange={handleChange} />
              </Button>

              <TextField
                label={t("inspectionForm.commentsLabel")}
                name="comments"
                value={form.comments}
                onChange={handleChange}
                placeholder={t("inspectionForm.commentsPlaceholder")}
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
                {submitting ? <CircularProgress size={22} /> : t("inspectionForm.submitBtn")}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </FormErrorBoundary>
  );
}