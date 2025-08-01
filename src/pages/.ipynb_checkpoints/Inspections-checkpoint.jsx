import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios"; // <-- Make sure this is correct
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

useEffect(() => {
  const fetchInspections = async () => {
    try {
      const res = await authAxios.get("/inspections");
      setInspections(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Token refresh likely failed in the interceptor
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert("Failed to fetch inspections. Please try again.");
        console.error("Fetch inspections error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchInspections();
}, []);

  const filtered = inspections.filter((insp) => {
    const textMatch =
      (insp.rider_id && insp.rider_id.toString().includes(search)) ||
      (insp.inspected_by && insp.inspected_by.toLowerCase().includes(search.toLowerCase())) ||
      (insp.id_number && insp.id_number.toLowerCase().includes(search.toLowerCase())) ||
      (insp.plate_number && insp.plate_number.toLowerCase().includes(search.toLowerCase())) ||
      (insp.box_serial_number && insp.box_serial_number.toLowerCase().includes(search.toLowerCase()));

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
      await authAxios.delete(`/inspections/${id}`);
      setInspections((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      alert("Failed to delete inspection.");
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await authAxios.patch(`/inspections/${editInspection.id}`, editInspection);
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
      <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto", py: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
          Inspections
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SearchIcon color="action" />
            <TextField
              label="Search by Rider ID, Inspector, ID Number, Plate, Box Serial"
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
              <Table size="small">
                <TableHead sx={{ background: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Rider ID</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>Plate Number</TableCell>
                    <TableCell>Box Serial Number</TableCell>
                    <TableCell>Inspected By</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Helmet</TableCell>
                    <TableCell>Box</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Parking</TableCell>
                    <TableCell>Appearance</TableCell>
                    <TableCell>Driving</TableCell>
                    <TableCell>MFC Status</TableCell>
                    <TableCell>Courier Behavior</TableCell>
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
                      <TableCell>{insp.plate_number ?? "—"}</TableCell>
                      <TableCell>{insp.box_serial_number ?? "—"}</TableCell>
                      <TableCell>{insp.inspected_by}</TableCell>
                      <TableCell>{insp.city || "—"}</TableCell>
                      <TableCell>{insp.location || "—"}</TableCell>
                      <TableCell>{insp.helmet || "—"}</TableCell>
                      <TableCell>{insp.box || "—"}</TableCell>
                      <TableCell>{insp.account || "—"}</TableCell>
                      <TableCell>{insp.parking || "—"}</TableCell>
                      <TableCell>{insp.appearance || "—"}</TableCell>
                      <TableCell>{insp.driving || "—"}</TableCell>
                      <TableCell>{insp.mfc_status || "—"}</TableCell>
                      <TableCell>{insp.courier_behavior || "—"}</TableCell>
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
                label="Plate Number"
                value={editInspection.plate_number ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, plate_number: e.target.value }))
                }
              />
              <TextField
                label="Box Serial Number"
                value={editInspection.box_serial_number ?? ""}
                onChange={(e) =>
                  setEditInspection((prev) => ({ ...prev, box_serial_number: e.target.value }))
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

              <FormControl fullWidth size="small">
                <InputLabel>Helmet</InputLabel>
                <Select
                  value={editInspection.helmet || ""}
                  label="Helmet"
                  onChange={e => setEditInspection(prev => ({ ...prev, helmet: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Box</InputLabel>
                <Select
                  value={editInspection.box || ""}
                  label="Box"
                  onChange={e => setEditInspection(prev => ({ ...prev, box: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Clean">Clean</MenuItem>
                  <MenuItem value="Dirty or torn">Dirty or torn</MenuItem>
                  <MenuItem value="Does not have a box">Does not have a box</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Account</InputLabel>
                <Select
                  value={editInspection.account || ""}
                  label="Account"
                  onChange={e => setEditInspection(prev => ({ ...prev, account: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Valid">Valid</MenuItem>
                  <MenuItem value="Rented">Rented</MenuItem>
                  <MenuItem value="Refused to provide account or CIN.">Refused to provide account or CIN.</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Parking</InputLabel>
                <Select
                  value={editInspection.parking || ""}
                  label="Parking"
                  onChange={e => setEditInspection(prev => ({ ...prev, parking: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Valid - in a dedicated area">Valid - in a dedicated area</MenuItem>
                  <MenuItem value="Not valid - in a prohibited area">Not valid - in a prohibited area</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Appearance</InputLabel>
                <Select
                  value={editInspection.appearance || ""}
                  label="Appearance"
                  onChange={e => setEditInspection(prev => ({ ...prev, appearance: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Valid - Decent attire with gilet">Valid - Decent attire with gilet</MenuItem>
                  <MenuItem value="Valid - Decent attire sans gilet">Valid - Decent attire sans gilet</MenuItem>
                  <MenuItem value="Not valid - wearing pyjama, Sandals, sabots etc">Not valid - wearing pyjama, Sandals, sabots etc</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Driving</InputLabel>
                <Select
                  value={editInspection.driving || ""}
                  label="Driving"
                  onChange={e => setEditInspection(prev => ({ ...prev, driving: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Reckless driving">Reckless driving</MenuItem>
                  <MenuItem value="Overspeed">Overspeed</MenuItem>
                  <MenuItem value="One way driving">One way driving</MenuItem>
                  <MenuItem value="Good Behavior">Good Behavior</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>MFC Status</InputLabel>
                <Select
                  value={editInspection.mfc_status || ""}
                  label="MFC Status"
                  onChange={e => setEditInspection(prev => ({ ...prev, mfc_status: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Ongoing order - waiting for pick up">Ongoing order - waiting for pick up</MenuItem>
                  <MenuItem value="Not ongoing order - waiting for new order">Not ongoing order - waiting for new order</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Courier Behavior</InputLabel>
                <Select
                  value={editInspection.courier_behavior || ""}
                  label="Courier Behavior"
                  onChange={e => setEditInspection(prev => ({ ...prev, courier_behavior: e.target.value }))}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="Valid - Collaborative, respectful">Valid - Collaborative, respectful</MenuItem>
                  <MenuItem value="Not valid - Not collaborative">Not valid - Not collaborative</MenuItem>
                </Select>
              </FormControl>
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