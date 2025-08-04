import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios";
import {
  Box,
  Typography,
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  OutlinedInput,
  TablePagination,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend } from "recharts";

const FIELDS_TO_CHART = ["helmet", "box", "account", "parking", "appearance", "driving", "mfc_status", "courier_behavior"];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#ff66c4", "#FF6666", "#66cc99"];

export default function InspectionsDashboard() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cityFilter, setCityFilter] = useState([]);
  const [inspectorFilter, setInspectorFilter] = useState([]);
  const [riderFilter, setRiderFilter] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editOpen, setEditOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await authAxios.get("/inspections");
        setInspections(res.data);
      } catch (error) {
        alert("Failed to fetch inspections");
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  const filtered = inspections.filter((insp) => {
    const matchesDate = (!startDate || new Date(insp.timestamp) >= startDate) && (!endDate || new Date(insp.timestamp) <= endDate);
    const matchesCity = cityFilter.length === 0 || cityFilter.includes(insp.city);
    const matchesInspector = inspectorFilter.length === 0 || inspectorFilter.includes(insp.inspected_by);
    const matchesRider = riderFilter.length === 0 || riderFilter.includes(insp.rider_id);
    return matchesDate && matchesCity && matchesInspector && matchesRider;
  });

  const scorecards = {
    inspections: filtered.length,
    inspectors: new Set(filtered.map(i => i.inspected_by)).size,
    cities: new Set(filtered.map(i => i.city)).size,
  };

  const getDonutData = (field) => {
    const counts = {};
    filtered.forEach((i) => {
      const val = i[field];
      if (val !== null && val !== undefined && val !== "—") {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const handleExportCSV = () => {
    const csvRows = [
      Object.keys(inspections[0] || {}).join(","),
      ...filtered.map(i => Object.values(i).map(v => `"${(v ?? "").toString().replace(/"/g, '"')}"`).join(","))
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

  const handleEdit = (row) => {
    setCurrentEdit(row);
    setEditOpen(true);
  };

const handleSaveEdit = async () => {
  try {
    const formData = new FormData();
    for (let key in currentEdit) {
      if (currentEdit[key] !== null && currentEdit[key] !== undefined) {
        formData.append(key, currentEdit[key]);
      }
    }

    await authAxios({
      method: "patch",
      url: `/inspections/${currentEdit.id}`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setInspections(prev =>
      prev.map(i => (i.id === currentEdit.id ? currentEdit : i))
    );
    setEditOpen(false);
  } catch (err) {
    alert("Failed to save changes.");
    console.error(err);
  }
};

  return (
    <Box sx={{ 
      p: 4, 
      background: "#f7fafd", 
      minHeight: "100vh",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Inspection Dashboard
      </Typography>

      {/* Filters */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, flexWrap: "wrap" }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker label="Start Date" value={startDate} onChange={setStartDate} />
          <DatePicker label="End Date" value={endDate} onChange={setEndDate} />
        </LocalizationProvider>

        {[{
          label: "City",
          value: cityFilter,
          onChange: setCityFilter,
          options: [...new Set(inspections.map(i => i.city))]
        }, {
          label: "Inspected By",
          value: inspectorFilter,
          onChange: setInspectorFilter,
          options: [...new Set(inspections.map(i => i.inspected_by))]
        }, {
          label: "Rider ID",
          value: riderFilter,
          onChange: setRiderFilter,
          options: [...new Set(inspections.map(i => i.rider_id))]
        }].map(({ label, value, onChange, options }) => (
          <FormControl sx={{ minWidth: 160 }} size="small" key={label}>
            <InputLabel>{label}</InputLabel>
            <Select
              multiple
              value={value}
              onChange={(e) => onChange(e.target.value)}
              input={<OutlinedInput label={label} />}
              renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map(val => <Chip key={val} label={val} />)}</Box>}
            >
              {options.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}

        <Button variant="outlined" onClick={handleExportCSV}>Export CSV</Button>
      </Stack>

      {/* Scorecards */}
      <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
        {Object.entries(scorecards).map(([label, val]) => (
          <Paper key={label} sx={{ p: 2, minWidth: 150, textAlign: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">{label.replace("_", " ").toUpperCase()}</Typography>
            <Typography variant="h6">{val}</Typography>
          </Paper>
        ))}
      </Stack>

      {/* Charts */}
      <Box sx={{ flex: 1, overflow: "auto", mb: 3 }}>
        <Grid container spacing={3}>
          {FIELDS_TO_CHART.map((field, idx) => {
            const data = getDonutData(field).filter(d => d.name !== "—");
            if (data.length === 0) return null;

            return (
              <Grid item xs={12} sm={6} md={3} key={field}>
                <Paper sx={{ 
                  p: 2, 
                  height: 400, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center"
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    {field.replace(/_/g, " ").toUpperCase()}
                  </Typography>
                  <Box sx={{ width: "100%", height: 320, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={100}
                          innerRadius={40}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {data.map((entry, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Inspection List */}
      <Box sx={{ height: "35vh", display: "flex", flexDirection: "column" }}>
        <Typography variant="h5" mb={2}>Inspection Records</Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper} sx={{ flex: 1, overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 60 }}>ID</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Rider ID</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Inspected By</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Location</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>City</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Image</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Comments</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>ID Number</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Timestamp</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Helmet</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Box</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Account</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Parking</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Appearance</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Driving</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>MFC Status</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Courier Behavior</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Box Serial</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Plate Number</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>MFC Location</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.rider_id}</TableCell>
                    <TableCell>{row.inspected_by}</TableCell>
                    <TableCell>{row.location || "—"}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell>
                      {row.image_url ? (
                        <img src={row.image_url} alt="preview" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                      ) : "—"}
                    </TableCell>
                    <TableCell>{row.comments || "—"}</TableCell>
                    <TableCell>{row.id_number || "—"}</TableCell>
                    <TableCell>{row.timestamp?.slice(0, 19).replace("T", " ")}</TableCell>
                    <TableCell>{row.helmet || "—"}</TableCell>
                    <TableCell>{row.box || "—"}</TableCell>
                    <TableCell>{row.account || "—"}</TableCell>
                    <TableCell>{row.parking || "—"}</TableCell>
                    <TableCell>{row.appearance || "—"}</TableCell>
                    <TableCell>{row.driving || "—"}</TableCell>
                    <TableCell>{row.mfc_status || "—"}</TableCell>
                    <TableCell>{row.courier_behavior || "—"}</TableCell>
                    <TableCell>{row.box_serial_number || "—"}</TableCell>
                    <TableCell>{row.plate_number || "—"}</TableCell>
                    <TableCell>{row.mfc_location || "—"}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}> <DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Edit Dialog */}
   <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Edit Inspection</DialogTitle>
  <DialogContent>
    {[
      "rider_id", "id_number", "plate_number", "box_serial_number", "helmet", "box",
      "account", "parking", "appearance", "driving", "mfc_status",
      "courier_behavior", "location", "city", "comments"
    ].map((field) => (
      <TextField
        key={field}
        label={field.replace(/_/g, " ").toUpperCase()}
        fullWidth
        sx={{ mt: 2 }}
        value={currentEdit?.[field] ?? ""}
        onChange={(e) =>
          setCurrentEdit((prev) => ({ ...prev, [field]: e.target.value }))
        }
      />
    ))}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}