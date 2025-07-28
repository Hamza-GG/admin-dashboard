import React, { useEffect, useState } from "react";
import axios from "axios";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ImageIcon from "@mui/icons-material/Image";
import EditIcon from "@mui/icons-material/Edit";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editInspection, setEditInspection] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchInspections() {
      try {
        const res = await axios.get("https://employee-inspection-backend.onrender.com/inspections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInspections(res.data);
      } catch (error) {
        alert("Failed to fetch inspections.");
      } finally {
        setLoading(false);
      }
    }
    fetchInspections();
  }, [token]);

  const filtered = inspections.filter((insp) => {
    const textMatch =
      (insp.rider_id && insp.rider_id.toString().includes(search)) ||
      (insp.inspected_by && insp.inspected_by.toLowerCase().includes(search.toLowerCase())) ||
      (insp.id_number && insp.id_number.toLowerCase().includes(search.toLowerCase()));

    let timeMatch = true;
    if (startDate) {
      timeMatch = timeMatch && insp.timestamp >= `${startDate.toISOString().slice(0, 10)}T00:00:00`;
    }
    if (endDate) {
      timeMatch = timeMatch && insp.timestamp <= `${endDate.toISOString().slice(0, 10)}T23:59:59`;
    }

    return textMatch && timeMatch;
  });

  async function handleDelete(id) {
    if (!window.confirm("Delete this inspection?")) return;
    try {
      await axios.delete(`https://employee-inspection-backend.onrender.com/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInspections((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      alert("Failed to delete inspection.");
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await axios.patch(
        `https://employee-inspection-backend.onrender.com/inspections/${editInspection.id}`,
        editInspection,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInspections((prev) =>
        prev.map((insp) => (insp.id === editInspection.id ? editInspection : insp))
      );
      setEditInspection(null);
    } catch (error) {
      alert("Failed to update inspection.");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7fafd",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1300, mx: "auto", py: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
          Inspections
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SearchIcon color="action" />
            <TextField
              label="Search by Rider ID, Inspector, or ID Number"
              variant="standard"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={date => setStartDate(date)}
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 150 } }
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={date => setEndDate(date)}
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 150 } }
                }}
              />
            </Box>
          </LocalizationProvider>
        </Paper>
        <Paper elevation={2}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography>Loading inspections...</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ p: 4 }}>No inspections found.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ background: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Rider ID</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Inspected By</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Helmet</TableCell>
                    <TableCell>Box</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Clothes</TableCell>
                    <TableCell>Well Behaved</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Comments</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((insp) => (
                    <TableRow key={insp.id}>
                      <TableCell>{insp.id}</TableCell>
                      <TableCell>{insp.rider_id ?? "N/A"}</TableCell>
                      <TableCell>{insp.id_number ?? "N/A"}</TableCell>
                      <TableCell>{insp.inspected_by}</TableCell>
                      <TableCell>{insp.city || "—"}</TableCell>
                      <TableCell>{insp.location || "—"}</TableCell>
                      <TableCell>{insp.helmet_ok ? "✅" : "❌"}</TableCell>
                      <TableCell>{insp.box_ok ? "✅" : "❌"}</TableCell>
                      <TableCell>{insp.id_ok ? "✅" : "❌"}</TableCell>
                      <TableCell>{insp.zone_ok ? "✅" : "❌"}</TableCell>
                      <TableCell>{insp.clothes_ok ? "✅" : "❌"}</TableCell>
                      <TableCell>{insp.well_behaved ? "✅" : "❌"}</TableCell>
                      <TableCell>
                        {insp.timestamp?.replace("T", " ").slice(0, 19)}
                      </TableCell>
                      <TableCell>
                        {insp.image_url ? (
                          <Tooltip title="View Image">
                            <a href={insp.image_url} target="_blank" rel="noopener noreferrer">
                              <ImageIcon />
                            </a>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{insp.comments || "—"}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => setEditInspection({ ...insp })}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(insp.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* --------- EDIT DIALOG --------- */}
      <Dialog open={!!editInspection} onClose={() => setEditInspection(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Inspection</DialogTitle>
        <DialogContent>
          {editInspection && (
            <Box component="form" onSubmit={handleEditSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Rider ID"
                value={editInspection.rider_id ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, rider_id: e.target.value || null }))
                }
              />
              <TextField
                label="ID Number"
                value={editInspection.id_number ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, id_number: e.target.value || null }))
                }
              />
              <TextField
                label="City"
                value={editInspection.city ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, city: e.target.value }))
                }
              />
              <TextField
                label="Location"
                value={editInspection.location ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, location: e.target.value }))
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editInspection.helmet_ok}
                    onChange={(e) =>
                      setEditInspection((prev) => ({ ...prev, helmet_ok: e.target.checked }))
                    }
                  />
                }
                label="Helmet OK"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editInspection.box_ok}
                    onChange={(e) =>
                      setEditInspection((prev) => ({ ...prev, box_ok: e.target.checked }))
                    }
                  />
                }
                label="Box OK"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editInspection.id_ok}
                    onChange={(e) =>
                      setEditInspection((prev) => ({ ...prev, id_ok: e.target.checked }))
                    }
                  />
                }
                label="ID OK"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editInspection.zone_ok}
                    onChange={(e) =>
                      setEditInspection((prev) => ({ ...prev, zone_ok: e.target.checked }))
                    }
                  />
                }
                label="Zone OK"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editInspection.clothes_ok}
                    onChange={(e) =>
                      setEditInspection((prev) => ({ ...prev, clothes_ok: e.target.checked }))
                    }
                  />
                }
                label="Clothes OK"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!editInspection.well_behaved}
                    onChange={(e) =>
                      setEditInspection((prev) => ({ ...prev, well_behaved: e.target.checked }))
                    }
                  />
                }
                label="Well Behaved"
              />
              <TextField
                label="Comments"
                value={editInspection.comments ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, comments: e.target.value }))
                }
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInspection(null)}>Cancel</Button>
          <Button type="submit" onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
