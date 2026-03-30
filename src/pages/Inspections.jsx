import React, { useCallback, useEffect, useMemo, useState } from "react";
import authAxios from "../utils/authAxios";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Tooltip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  OutlinedInput,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { saveAs } from "file-saver";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import Grid from "@mui/material/Grid";

export default function InspectionsDashboard() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState([]);
  const [inspectorFilter, setInspectorFilter] = useState([]);
  const [riderFilter, setRiderFilter] = useState([]);
  const [formFilter, setFormFilter] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeFrom, setTimeFrom] = useState(null); // dayjs | null
  const [timeTo, setTimeTo] = useState(null); // dayjs | null

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editFieldsObj, setEditFieldsObj] = useState({});
  const [editCustomObj, setEditCustomObj] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await authAxios.get(`/inspections?ts=${Date.now()}`);
        setInspections(res.data);
        try {
          const formsRes = await authAxios.get(`/forms?ts=${Date.now()}`);
          setForms(Array.isArray(formsRes.data) ? formsRes.data : []);
        } catch (e) {
          setForms([]);
        }
      } catch (error) {
        alert("Failed to fetch inspections");
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  const refetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authAxios.get(`/inspections?ts=${Date.now()}`);
      setInspections(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to refresh inspections");
    } finally {
      setLoading(false);
    }
  }, []);

  const getField = (insp, key) => {
    const f = insp?.fields || {};
    return f?.[key] ?? "";
  };

  const toStr = (v) => {
    if (v === null || v === undefined) return "";
    return String(v);
  };

  const getInspectionTime = (insp) => {
    // Prefer top-level timestamps if present
    const t = insp?.control_time || insp?.controlTime || insp?.created_at || insp?.createdAt || insp?.timestamp;
    if (t) return t;

    // Fallback: sometimes stored inside fields
    const f = insp?.fields || {};
    return (
      f?.control_time ||
      f?.controlTime ||
      f?.created_at ||
      f?.createdAt ||
      f?.timestamp ||
      ""
    );
  };

  const getInspectionDate = (insp) => {
    const t = getInspectionTime(insp);
    if (!t) return "";

    // 1) Try dayjs (works for most ISO strings)
    const parsed = dayjs(t);
    if (parsed.isValid()) return parsed.format("YYYY-MM-DD");

    // 2) Try native Date parsing (handles some edge cases dayjs may treat as invalid)
    const dNative = new Date(String(t));
    if (!Number.isNaN(dNative.getTime())) {
      const yyyy = dNative.getFullYear();
      const mm = String(dNative.getMonth() + 1).padStart(2, "0");
      const dd = String(dNative.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    // 3) Fallback: slice YYYY-MM-DD
    const s = String(t);
    const d = s.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
  };

  const filtered = inspections.filter((insp) => {
    const city = toStr(getField(insp, "city"));
    const riderId = toStr(getField(insp, "rider_id"));
    const inspectedBy = toStr(insp?.inspected_by);
    const formName = toStr(insp?.form_name);

    const matchesCity = cityFilter.length === 0 || cityFilter.includes(city);
    const matchesInspector = inspectorFilter.length === 0 || inspectorFilter.includes(inspectedBy);
    const matchesRider = riderFilter.length === 0 || riderFilter.includes(riderId);
    const matchesForm = formFilter.length === 0 || formFilter.includes(formName);

    const inspDate = getInspectionDate(insp); // YYYY-MM-DD
    const fromStr = timeFrom ? timeFrom.format("YYYY-MM-DD") : "";
    const toStrD = timeTo ? timeTo.format("YYYY-MM-DD") : "";

    const matchesTime = (() => {
      if (!fromStr && !toStrD) return true;
      if (!inspDate) return false;
      if (fromStr && inspDate < fromStr) return false;
      if (toStrD && inspDate > toStrD) return false;
      return true;
    })();

    return matchesCity && matchesInspector && matchesRider && matchesForm && matchesTime;
  });

  const fieldKeys = React.useMemo(() => {
    const keys = new Set();
    filtered.forEach((row) => {
      const f = row?.fields;
      if (f && typeof f === "object") {
        Object.keys(f).forEach((k) => {
          if (k !== "custom_fields") keys.add(k);
        });
      }
    });
    return Array.from(keys).sort();
  }, [filtered]);

  const customFieldKeys = React.useMemo(() => {
    const keys = new Set();
    filtered.forEach((row) => {
      const cf = (row.fields || {}).custom_fields;
      if (cf && typeof cf === "object") {
        Object.keys(cf).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys).sort();
  }, [filtered]);

  const allColumnKeys = React.useMemo(() => {
    // top-level fields first, then custom.*
    return [
      ...fieldKeys,
      ...customFieldKeys.map((k) => `custom.${k}`),
    ];
  }, [fieldKeys, customFieldKeys]);

  const handleExportCSV = () => {
    const rows = filtered.map((i) => {
      const f = (i.fields && typeof i.fields === "object") ? i.fields : {};
      const cf = (f.custom_fields && typeof f.custom_fields === "object") ? f.custom_fields : {};

      const row = {
        id: i.id,
        inspected_by: i.inspected_by,
        form_name: i.form_name,
      };

      // top-level fields
      fieldKeys.forEach((k) => {
        row[k] = f?.[k] ?? "";
      });

      // custom fields with prefix to avoid collisions
      customFieldKeys.forEach((k) => {
        row[`custom.${k}`] = cf?.[k] ?? "";
      });

      return row;
    });

    const headers = Object.keys(rows[0] || { id: "", inspected_by: "", form_name: "" });
    const csvRows = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "inspections.csv");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inspection?")) return;
    try {
      await authAxios.delete(`/inspections/${id}`);
      setInspections(prev => prev.filter(i => i.id !== id));
      alert("Inspection deleted.");
    } catch (err) {
      alert("Failed to delete inspection.");
      console.error(err);
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    const f = (row?.fields && typeof row.fields === "object") ? row.fields : {};
    const cf = (f.custom_fields && typeof f.custom_fields === "object") ? f.custom_fields : {};

    // Keep top-level fields editable (excluding custom_fields container)
    const top = { ...f };
    delete top.custom_fields;

    setEditFieldsObj(top);
    setEditCustomObj({ ...cf });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRow(null);
    setEditFieldsObj({});
    setEditCustomObj({});
  };

  const saveEdit = async () => {
    if (!editRow) return;

    // Rebuild the fields payload
    const payloadFields = {
      ...(editFieldsObj || {}),
      custom_fields: (editCustomObj && typeof editCustomObj === "object") ? editCustomObj : {},
    };

    setSavingEdit(true);
    try {
      const resp = await authAxios.patch(`/inspections/${editRow.id}/fields`, { fields: payloadFields });

      // Prefer server-returned inspection (source of truth)
      const updated = resp?.data;
      if (updated && typeof updated === "object") {
        setInspections((prev) => prev.map((x) => (x.id === editRow.id ? { ...x, ...updated } : x)));
      } else {
        setInspections((prev) => prev.map((x) => (x.id === editRow.id ? { ...x, fields: payloadFields } : x)));
      }

      closeEdit();

      // Re-fetch to avoid any caching/CDN stale data and confirm persistence
      await refetchInspections();
    } catch (err) {
      console.error(err);
      alert("Failed to update inspection.");
    } finally {
      setSavingEdit(false);
    }
  };

  const getDisplayValue = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const normalizeInputValue = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    // keep numbers/booleans editable
    return String(v);
  };

  const setTopField = (key, value) => {
    setEditFieldsObj((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const setCustomField = (key, value) => {
    setEditCustomObj((prev) => {
      const p = prev || {};
      // Don't allow creating new keys from this screen
      if (!(key in p)) return p;
      return { ...p, [key]: value };
    });
  };
  const formsByName = useMemo(() => {
    const m = new Map();
    (forms || []).forEach((f) => {
      const name = toStr(f?.name || f?.form_name);
      if (name) m.set(name, f);
    });
    return m;
  }, [forms]);

  const getFormSchemaFields = useCallback((formName) => {
    const f = formsByName.get(toStr(formName));
    const fieldsArr = f?.schema?.fields;
    return Array.isArray(fieldsArr) ? fieldsArr : [];
  }, [formsByName]);

  const getSchemaFieldById = useCallback((formName, fieldId) => {
    const fieldsArr = getFormSchemaFields(formName);
    const id = toStr(fieldId);
    return fieldsArr.find((x) => toStr(x?.id) === id) || null;
  }, [getFormSchemaFields]);

  const renderEditableValue = useCallback((formName, fieldId, value, onChange) => {
    const meta = getSchemaFieldById(formName, fieldId);
    const type = toStr(meta?.type).toLowerCase();
    const options = Array.isArray(meta?.options) ? meta.options : null;

    if (type === "select" && options && options.length > 0) {
      const current = value === null || value === undefined ? "" : String(value);
      return (
        <FormControl fullWidth size="small">
          <Select value={current} onChange={(e) => onChange(e.target.value)} displayEmpty>
            <MenuItem value="">
              <em>(empty)</em>
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={String(opt)} value={String(opt)}>
                {String(opt)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        value={normalizeInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        size="small"
      />
    );
  }, [getSchemaFieldById]);

  const isLikelyImageUrl = (v) => {
    const s = String(v || "").trim();
    if (!s) return false;
    // Basic checks for typical image URLs
    return (
      /^https?:\/\//i.test(s) &&
      /(\.(png|jpe?g|gif|webp)(\?|#|$))|image|uploads|s3/i.test(s)
    );
  };

  const renderMaybeImage = (val) => {
    const s = String(val || "").trim();
    if (!s) return "—";
    if (!isLikelyImageUrl(s)) return null;

    return (
      <a href={s} target="_blank" rel="noreferrer">
        <img
          src={s}
          alt="preview"
          style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }}
          loading="lazy"
        />
      </a>
    );
  };

  const Pie = ({ data, size = 120 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (!total) return <Typography variant="body2">No data</Typography>;

    const r = size / 2;
    const cx = r;
    const cy = r;

    let start = -Math.PI / 2;
    const arcs = data.map((d) => {
      const angle = (d.value / total) * Math.PI * 2;
      const end = start + angle;

      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);

      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      start = end;
      return { path, label: d.label, value: d.value };
    });

    // Simple deterministic color palette
    const palette = [
      "#4e79a7",
      "#f28e2b",
      "#e15759",
      "#76b7b2",
      "#59a14f",
      "#edc948",
      "#b07aa1",
      "#ff9da7",
      "#9c755f",
      "#bab0ac",
    ];

    // SVG arc commands can't draw a perfect full circle when start/end are the same.
    // If we only have one slice (or one slice equals 100%), draw a circle instead.
    const singleSlice = data.length === 1 || data.some((d) => d.value === total);

    return (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {singleSlice ? (
            <circle cx={cx} cy={cy} r={r} fill={palette[0]} />
          ) : (
            arcs.map((a, idx) => (
              <path key={idx} d={a.path} fill={palette[idx % palette.length]} />
            ))
          )}
        </svg>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {data.map((d, idx) => (
            <Box key={d.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: palette[idx % palette.length] }} />
              <Typography variant="caption" sx={{ maxWidth: 180 }}>
                {d.label} ({d.value})
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const selectedFormName = formFilter.length === 1 ? formFilter[0] : null;

  const pieCharts = useMemo(() => {
    if (!selectedFormName) return [];

    // Build distributions from filtered data (which already includes the form filter)
    const rows = filtered;
    if (!rows.length) return [];

    // Collect custom field keys present
    const keys = new Set();
    rows.forEach((row) => {
      const cf = ((row.fields || {}).custom_fields) || {};
      if (cf && typeof cf === "object") {
        Object.keys(cf).forEach((k) => keys.add(k));
      }
    });

    const charts = [];

    Array.from(keys)
      .sort()
      .forEach((k) => {
        const counts = new Map();
        rows.forEach((row) => {
          const cf = ((row.fields || {}).custom_fields) || {};
          let v = cf?.[k];
          if (v === null || v === undefined || v === "") v = "(empty)";
          const label = typeof v === "string" ? v : JSON.stringify(v);
          counts.set(label, (counts.get(label) || 0) + 1);
        });

        // Skip very high-cardinality fields (free text) — keep UX sane
        const uniqueCount = counts.size;
        if (uniqueCount > 25) return;

        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

        // Top 6 + Other
        const top = sorted.slice(0, 6).map(([label, value]) => ({ label, value }));
        const otherSum = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
        if (otherSum > 0) top.push({ label: "Other", value: otherSum });

        charts.push({ key: k, data: top, total: rows.length, uniqueCount });
      });

    return charts;
  }, [selectedFormName, filtered, formFilter]);

  const formOptions = useMemo(
    () => Array.from(new Set(inspections.map((i) => toStr(i?.form_name)).filter(Boolean))).sort(),
    [inspections]
  );

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(inspections.map((i) => toStr((i.fields || {}).city)).filter(Boolean))
      ).sort(),
    [inspections]
  );

  const inspectorOptions = useMemo(
    () => Array.from(new Set(inspections.map((i) => toStr(i?.inspected_by)).filter(Boolean))).sort(),
    [inspections]
  );

  const riderOptions = useMemo(
    () =>
      Array.from(
        new Set(inspections.map((i) => toStr((i.fields || {}).rider_id)).filter(Boolean))
      ).sort(),
    [inspections]
  );

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0f4f8 0%, #e8f4f0 50%, #f0f4f8 100%)" }}>
      {/* Page header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0f2744 0%, #1a3254 55%, #00896d 100%)",
          color: "#fff",
          px: { xs: 3, md: 6 },
          py: 4,
          mb: 0,
        }}
      >
        <Typography variant="h4" fontWeight={800} sx={{ color: "#fff", letterSpacing: -0.5 }}>
          Inspection Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
          Filtrer, visualiser et exporter les données de contrôle
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Filters */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, flexWrap: "wrap" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Control time from"
            value={timeFrom}
            onChange={(v) => setTimeFrom(v)}
            format="YYYY-MM-DD"
            slotProps={{ textField: { size: "small", sx: { minWidth: 180 } } }}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Control time to"
            value={timeTo}
            onChange={(v) => setTimeTo(v)}
            format="YYYY-MM-DD"
            slotProps={{ textField: { size: "small", sx: { minWidth: 180 } } }}
          />
        </LocalizationProvider>
        {[{
          label: "Form",
          value: formFilter,
          onChange: setFormFilter,
          options: formOptions
        }, {
          label: "City",
          value: cityFilter,
          onChange: setCityFilter,
          options: cityOptions
        }, {
          label: "Inspected By",
          value: inspectorFilter,
          onChange: setInspectorFilter,
          options: inspectorOptions
        }, {
          label: "Rider ID",
          value: riderFilter,
          onChange: setRiderFilter,
          options: riderOptions
        }].map(({ label, value, onChange, options }) => (
          <FormControl sx={{ minWidth: 160 }} size="small" key={label}>
            <InputLabel>{label}</InputLabel>
            <Select
              multiple
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                onChange(typeof v === "string" ? v.split(",") : v);
              }}
              input={<OutlinedInput label={label} />}
              renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((val) => <Chip key={val} label={val} />)}</Box>}
            >
              {options.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}

        <Button variant="outlined" onClick={handleExportCSV}>Export CSV</Button>
      </Stack>

      {selectedFormName && pieCharts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Custom fields breakdown — {selectedFormName}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Showing pie charts for custom fields (high-cardinality free-text fields are hidden).
          </Typography>

          <Grid container spacing={2}>
            {pieCharts.map((c) => (
              <Grid item xs={12} md={6} lg={4} key={c.key}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                    {c.key}
                  </Typography>
                  <Pie data={c.data} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Inspection List */}
      <Box mt={6}>
        <Typography variant="h5" mb={2}>Inspection Records</Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Form</TableCell>
                  <TableCell>Inspected By</TableCell>
                  {allColumnKeys.map((k) => (
                    <TableCell key={k}>{k.replace(/^custom\./, "").replace(/_/g, " ")}</TableCell>
                  ))}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                  const f = (row.fields && typeof row.fields === "object") ? row.fields : {};
                  const cf = (f.custom_fields && typeof f.custom_fields === "object") ? f.custom_fields : {};

                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.form_name}</TableCell>
                      <TableCell>{row.inspected_by}</TableCell>

                      {allColumnKeys.map((k) => {
                        if (k.startsWith("custom.")) {
                          const ck = k.replace(/^custom\./, "");
                          const val = cf?.[ck];
                          const img = renderMaybeImage(val);
                          if (img) return <TableCell key={k}>{img}</TableCell>;
                          return <TableCell key={k}>{getDisplayValue(val)}</TableCell>;
                        }

                        const val = f?.[k];
                        const img = renderMaybeImage(val);
                        if (img) return <TableCell key={k}>{img}</TableCell>;
                        return <TableCell key={k}>{getDisplayValue(val)}</TableCell>;
                      })}

                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filtered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        )}
      </Box>
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit inspection #{editRow?.id}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Edit inspection fields (top-level) and custom fields. Changes are saved to the database.
          </Typography>
          <Typography variant="caption" sx={{ mb: 2, display: "block", color: "text.secondary" }}>
            Note: you can only edit existing fields (no adding/removing fields from this screen).
          </Typography>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Fields
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.keys(editFieldsObj || {}).sort().map((k) => (
              <Grid item xs={12} md={6} key={k}>
                <Box>
                  <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary" }}>
                    {k}
                  </Typography>
                  {renderEditableValue(editRow?.form_name, k, editFieldsObj?.[k], (v) => setTopField(k, v))}
                </Box>
              </Grid>
            ))}
            {Object.keys(editFieldsObj || {}).length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">No top-level fields found.</Typography>
              </Grid>
            )}
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Custom fields
          </Typography>
          <Grid container spacing={2}>
            {Object.keys(editCustomObj || {}).sort().map((k) => (
              <Grid item xs={12} key={k}>
                <Box>
                  <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary" }}>
                    {k}
                  </Typography>
                  {renderEditableValue(editRow?.form_name, k, editCustomObj?.[k], (v) => setCustomField(k, v))}
                </Box>
              </Grid>
            ))}
            {Object.keys(editCustomObj || {}).length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">No custom fields found.</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={savingEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={savingEdit}>
            {savingEdit ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
}