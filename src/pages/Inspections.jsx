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

  return (
    <Box sx={{ p: 4, background: "#f7fafd", minHeight: "100vh" }}>
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {FIELDS_TO_CHART.map((field) => {
          const data = getDonutData(field);
          if (data.length === 0) return null;

          return (
            <Grid item xs={12} sm={6} md={3} key={field}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" gutterBottom>{field.replace(/_/g, " ").toUpperCase()}</Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={60} label>
                      {data.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
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
                  {FIELDS_TO_CHART.map(f => <TableCell key={f}>{f.replace(/_/g, " ")}</TableCell>)}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.rider_id}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell>{row.inspected_by}</TableCell>
                    <TableCell>{row.timestamp?.slice(0, 19).replace("T", " ")}</TableCell>
                    {FIELDS_TO_CHART.map(f => <TableCell key={f}>{row[f] || "—"}</TableCell>)}
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => alert("Inline edit coming soon!")}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => alert("Delete logic TBD")}> <DeleteIcon fontSize="small" /></IconButton>
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
    </Box>
  );
}