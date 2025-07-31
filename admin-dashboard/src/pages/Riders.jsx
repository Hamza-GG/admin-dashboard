import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Box, CircularProgress
} from "@mui/material";
import { Add, Edit, Delete, Save, Cancel } from "@mui/icons-material";

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: "",
    first_last_name: "",
    id_number: "",
    city_code: "",
    vehicle_type: "",
    joined_at: "",
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchRiders(); }, []);

  async function fetchRiders() {
    setLoading(true);
    try {
      const { data } = await axios.get("https://employee-inspection-backend.onrender.com//riders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRiders(data);
    } catch {
      alert("Failed to load riders.");
    }
    setLoading(false);
  }

  function startEdit(rider) {
    setEditingId(rider.rider_id);
    setEditForm({
      first_name: rider.first_name,
      first_last_name: rider.first_last_name,
      id_number: rider.id_number,
      city_code: rider.city_code,
      vehicle_type: rider.vehicle_type,
      joined_at: rider.joined_at
        ? new Date(rider.joined_at).toISOString().slice(0, 16)
        : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit(rider_id) {
    try {
      await axios.put(`https://employee-inspection-backend.onrender.com//riders/${rider_id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Rider updated!");
      setEditingId(null);
      fetchRiders();
    } catch (e) {
      alert("Failed to update rider.");
    }
  }

  async function handleDelete(rider_id) {
    if (!window.confirm("Delete this rider?")) return;
    try {
      await axios.delete(`https://employee-inspection-backend.onrender.com//riders/${rider_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRiders();
    } catch {
      alert("Failed to delete rider.");
    }
  }

  function handleAddChange(e) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitAdd(e) {
    e.preventDefault();
    try {
      await axios.post("https://employee-inspection-backend.onrender.com//riders", addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddForm(false);
      setAddForm({
        first_name: "",
        first_last_name: "",
        id_number: "",
        city_code: "",
        vehicle_type: "",
        joined_at: "",
      });
      fetchRiders();
    } catch (e) {
      alert("Failed to add rider.");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f7fafd",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
        align="center"
        sx={{ mt: 7, mb: 2 }}
      >
        Riders Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={() => setShowAddForm(true)}
        sx={{ mb: 3, fontWeight: "bold", fontSize: 16, px: 2 }}
      >
        Add New Rider
      </Button>
      <Dialog open={showAddForm} onClose={() => setShowAddForm(false)}>
        <DialogTitle>Add New Rider</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={submitAdd}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 350,
              mt: 1,
            }}
          >
            <TextField
              label="First Name"
              name="first_name"
              value={addForm.first_name}
              onChange={handleAddChange}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              name="first_last_name"
              value={addForm.first_last_name}
              onChange={handleAddChange}
              required
              fullWidth
            />
            <TextField
              label="ID Number"
              name="id_number"
              value={addForm.id_number}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              label="City Code"
              name="city_code"
              value={addForm.city_code}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              label="Vehicle Type"
              name="vehicle_type"
              value={addForm.vehicle_type}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              label="Joined At"
              name="joined_at"
              type="datetime-local"
              value={addForm.joined_at}
              onChange={handleAddChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <DialogActions>
              <Button
                onClick={() => setShowAddForm(false)}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                startIcon={<Save />}
              >
                Save
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mt: 1,
          width: "100%",
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
            <Typography>Loading riders...</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>ID Number</TableCell>
                  <TableCell>City Code</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Joined At</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riders.map((r) =>
                  editingId === r.rider_id ? (
                    <TableRow key={r.rider_id}>
                      <TableCell>{r.rider_id}</TableCell>
                      <TableCell>
                        <TextField
                          name="first_name"
                          value={editForm.first_name}
                          onChange={handleEditChange}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="first_last_name"
                          value={editForm.first_last_name}
                          onChange={handleEditChange}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="id_number"
                          value={editForm.id_number}
                          onChange={handleEditChange}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="city_code"
                          value={editForm.city_code || ""}
                          onChange={handleEditChange}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="vehicle_type"
                          value={editForm.vehicle_type || ""}
                          onChange={handleEditChange}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="datetime-local"
                          name="joined_at"
                          value={editForm.joined_at}
                          onChange={handleEditChange}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => saveEdit(r.rider_id)}>
                          <Save />
                        </IconButton>
                        <IconButton color="secondary" onClick={cancelEdit}>
                          <Cancel />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={r.rider_id}>
                      <TableCell>{r.rider_id}</TableCell>
                      <TableCell>{r.first_name}</TableCell>
                      <TableCell>{r.first_last_name}</TableCell>
                      <TableCell>{r.id_number}</TableCell>
                      <TableCell>{r.city_code}</TableCell>
                      <TableCell>{r.vehicle_type}</TableCell>
                      <TableCell>
                        {r.joined_at ? new Date(r.joined_at).toLocaleString() : ""}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => startEdit(r)}>
                          <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(r.rider_id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}