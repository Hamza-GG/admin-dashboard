import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios";
import { Avatar } from "@mui/material";
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
  Dialog,
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
    <>
      <Box sx={{ p: 4, background: "#f7fafd", minHeight: "100vh" }}>
        {/* Dashboard content (filters, charts, etc.) */}

        {/* Filters */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker label="Start Date" value={startDate} onChange={setStartDate} renderInput={(params) => <TextField fullWidth {...params} />} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker label="End Date" value={endDate} onChange={setEndDate} renderInput={(params) => <TextField fullWidth {...params} />} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select multiple value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} input={<OutlinedInput label="City" />} renderValue={(selected) => <Stack direction="row" gap={1}>{selected.map((value) => <Chip key={value} label={value} />)}</Stack>}>
                {[...new Set(inspections.map(i => i.city))].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Inspector</InputLabel>
              <Select multiple value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)} input={<OutlinedInput label="Inspector" />} renderValue={(selected) => <Stack direction="row" gap={1}>{selected.map((value) => <Chip key={value} label={value} />)}</Stack>}>
                {[...new Set(inspections.map(i => i.inspected_by))].map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Rider</InputLabel>
              <Select multiple value={riderFilter} onChange={(e) => setRiderFilter(e.target.value)} input={<OutlinedInput label="Rider" />} renderValue={(selected) => <Stack direction="row" gap={1}>{selected.map((value) => <Chip key={value} label={value} />)}</Stack>}>
                {[...new Set(inspections.map(i => i.rider_id))].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button onClick={handleExportCSV} variant="outlined" fullWidth startIcon={<SearchIcon />}>Export CSV</Button>
          </Grid>
        </Grid>

        {/* Donut Charts */}
        <Grid container spacing={2}>
          {FIELDS_TO_CHART.map((field, index) => {
            const data = getDonutData(field);
            return (
              <Grid item xs={12} sm={6} md={3} key={field}>
                <Typography align="center" variant="subtitle1">{field.replace(/_/g, " ").toUpperCase()}</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={60} label>
                      {data.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            );
          })}
        </Grid>

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
                    <TableCell>Rider ID</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Inspected By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Comments</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Plate Number</TableCell>
                    <TableCell>Box Serial</TableCell>
                    <TableCell>MFC Location</TableCell>
                    {FIELDS_TO_CHART.map(f => (
                      <TableCell key={f}>{f.replace(/_/g, " ")}</TableCell>
                    ))}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.rider_id}</TableCell>
                        <TableCell>{row.city}</TableCell>
                        <TableCell>{row.inspected_by}</TableCell>
                        <TableCell>{row.timestamp?.slice(0, 19).replace("T", " ")}</TableCell>
                        <TableCell>
                          {row.image_url ? (
                            <a href={row.image_url} target="_blank" rel="noopener noreferrer">
                              <Avatar src={row.image_url} alt="img" sx={{ width: 32, height: 32 }} />
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{row.comments || "—"}</TableCell>
                        <TableCell>{row.id_number || "—"}</TableCell>
                        <TableCell>{row.plate_number || "—"}</TableCell>
                        <TableCell>{row.box_serial_number || "—"}</TableCell>
                        <TableCell>{row.mfc_location || "—"}</TableCell>
                        {FIELDS_TO_CHART.map(f => (
                          <TableCell key={f}>{row[f] || "—"}</TableCell>
                        ))}
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(row.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          )}
        </Box>
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Inspection</DialogTitle>
          <DialogContent>
            {["rider_id", "id_number", "plate_number", "box_serial_number", "helmet", "box",
              "account", "parking", "appearance", "driving", "mfc_status",
              "courier_behavior", "location", "city", "comments", "mfc_location"
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
    </>
  );
}