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
  MenuItem,
  Stack,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const token = localStorage.getItem("token");

  const emptyForm = {
    rider_id: "", // Optional, as a string initially
    first_name: "",
    first_last_name: "",
    id_number: "",
    city_code: "",
    vehicle_type: "",
    box_serial_number: "",
    plate_number: "",
    joined_at: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    async function fetchRiders() {
      try {
        const res = await axios.get(
          "https://employee-inspection-backend.onrender.com/riders",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRiders(res.data);
      } catch (error) {
        alert("Failed to fetch riders.");
      } finally {
        setLoading(false);
      }
    }
    fetchRiders();
  }, [token]);

  const filtered = riders.filter((r) =>
    [r.rider_id, r.first_name, r.first_last_name, r.id_number, r.city_code, r.vehicle_type, r.plate_number, r.box_serial_number]
      .map((v) => (v ? v.toString().toLowerCase() : ""))
      .some((v) => v.includes(search.toLowerCase()))
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddOpen() {
    setForm(emptyForm);
    setOpenAdd(true);
  }

  function handleEditOpen(rider) {
    setSelectedRider(rider);
    setForm({ ...rider, joined_at: rider.joined_at ? rider.joined_at.slice(0, 10) : "" });
    setOpenEdit(true);
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form };
      // Only send rider_id if filled, and as a number
      if (data.rider_id === "") {
        delete data.rider_id;
      } else {
        data.rider_id = Number(data.rider_id);
      }
      await axios.post(
        "https://employee-inspection-backend.onrender.com/riders",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload(); // Refresh to show new rider (or re-fetch)
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to add rider.");
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form };
      // Always send rider_id as number for edit
      if (data.rider_id !== "") {
        data.rider_id = Number(data.rider_id);
      }
      await axios.put(
        `https://employee-inspection-backend.onrender.com/riders/${selectedRider.rider_id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to update rider.");
    }
  }

  async function handleDelete(rider_id) {
    if (!window.confirm("Delete this rider?")) return;
    try {
      await axios.delete(
        `https://employee-inspection-backend.onrender.com/riders/${rider_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRiders((prev) => prev.filter((r) => r.rider_id !== rider_id));
    } catch (error) {
      alert("Failed to delete rider.");
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
        backgroundColor: "#f7fafd",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", py: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Riders
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddOpen}
            sx={{ bgcolor: "#17417e", ":hover": { bgcolor: "#122e57" } }}
          >
            Add Rider
          </Button>
        </Stack>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SearchIcon color="action" />
            <TextField
              label="Search (ID, Name, Plate, etc)"
              variant="standard"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
        </Paper>
        <Paper elevation={2}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography>Loading riders...</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ p: 4 }}>No riders found.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ background: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>Rider ID</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>City Code</TableCell>
                    <TableCell>Vehicle Type</TableCell>
                    <TableCell>Box Serial Number</TableCell>
                    <TableCell>Plate Number</TableCell>
                    <TableCell>Joined At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((rider) => (
                    <TableRow key={rider.rider_id}>
                      <TableCell>{rider.rider_id}</TableCell>
                      <TableCell>{rider.first_name}</TableCell>
                      <TableCell>{rider.first_last_name}</TableCell>
                      <TableCell>{rider.id_number}</TableCell>
                      <TableCell>{rider.city_code}</TableCell>
                      <TableCell>{rider.vehicle_type}</TableCell>
                      <TableCell>{rider.box_serial_number}</TableCell>
                      <TableCell>{rider.plate_number}</TableCell>
                      <TableCell>{rider.joined_at?.slice(0, 10)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleEditOpen(rider)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(rider.rider_id)}>
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

      {/* --------- ADD DIALOG --------- */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Rider</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleAddSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <TextField
              label="Courier ID (optional)"
              name="rider_id"
              value={form.rider_id}
              onChange={handleChange}
              placeholder="e.g. 123"
              type="number"
            />
            <TextField
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Last Name"
              name="first_last_name"
              value={form.first_last_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="ID Number"
              name="id_number"
              value={form.id_number}
              onChange={handleChange}
              required
            />
            <TextField
              label="City Code"
              name="city_code"
              value={form.city_code}
              onChange={handleChange}
              required
            />
            <TextField
              label="Vehicle Type"
              name="vehicle_type"
              value={form.vehicle_type}
              onChange={handleChange}
              required
            />
            <TextField
              label="Box Serial Number"
              name="box_serial_number"
              value={form.box_serial_number}
              onChange={handleChange}
            />
            <TextField
              label="Plate Number"
              name="plate_number"
              value={form.plate_number}
              onChange={handleChange}
            />
            <TextField
              label="Joined At"
              name="joined_at"
              type="date"
              value={form.joined_at}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                Save
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --------- EDIT DIALOG --------- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rider</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleEditSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <TextField
              label="Courier ID"
              name="rider_id"
              value={form.rider_id}
              disabled
            />
            <TextField
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Last Name"
              name="first_last_name"
              value={form.first_last_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="ID Number"
              name="id_number"
              value={form.id_number}
              onChange={handleChange}
              required
            />
            <TextField
              label="City Code"
              name="city_code"
              value={form.city_code}
              onChange={handleChange}
              required
            />
            <TextField
              label="Vehicle Type"
              name="vehicle_type"
              value={form.vehicle_type}
              onChange={handleChange}
              required
            />
            <TextField
              label="Box Serial Number"
              name="box_serial_number"
              value={form.box_serial_number}
              onChange={handleChange}
            />
            <TextField
              label="Plate Number"
              name="plate_number"
              value={form.plate_number}
              onChange={handleChange}
            />
            <TextField
              label="Joined At"
              name="joined_at"
              type="date"
              value={form.joined_at}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                Save
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}