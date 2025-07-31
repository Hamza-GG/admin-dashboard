// src/pages/Riders.jsx
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
  Stack,
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

  const emptyForm = {
    rider_id: "",
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
        const res = await authAxios.get("/riders");
        setRiders(res.data);
      } catch (error) {
        alert("Failed to fetch riders.");
      } finally {
        setLoading(false);
      }
    }
    fetchRiders();
  }, []);

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
      if (data.rider_id === "") {
        delete data.rider_id;
      } else {
        data.rider_id = Number(data.rider_id);
      }
      await authAxios.post("/riders", data);
      window.location.reload();
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to add rider.");
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form };
      if (data.rider_id !== "") {
        data.rider_id = Number(data.rider_id);
      }
      await authAxios.put(`/riders/${selectedRider.rider_id}`, data);
      window.location.reload();
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to update rider.");
    }
  }

  async function handleDelete(rider_id) {
    if (!window.confirm("Delete this rider?")) return;
    try {
      await authAxios.delete(`/riders/${rider_id}`);
      setRiders((prev) => prev.filter((r) => r.rider_id !== rider_id));
    } catch (error) {
      alert("Failed to delete rider.");
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f7fafd", p: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Riders
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddOpen}>
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

      {/* Add and Edit dialogs remain unchanged */}
      {/* ... You can paste them here as-is ... */}
    </Box>
  );
}
