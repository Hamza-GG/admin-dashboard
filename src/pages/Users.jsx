// src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import authAxios from "../utils/authAxios";
import {
  Box, Typography, TextField, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Stack
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { MenuItem } from "@mui/material";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const emptyForm = {
    username: "",
    role: "",
    password: "",
    is_verified: false,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await authAxios.get("/users");
        setUsers(res.data);
      } catch (err) {
        alert("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    [u.username, u.role].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddOpen() {
    setForm(emptyForm);
    setOpenAdd(true);
  }

  function handleEditOpen(user) {
    setSelectedUser(user);
    setForm({ ...user, password: "" });
    setOpenEdit(true);
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    try {
      await authAxios.post("/register", form);
      window.location.reload();
    } catch (err) {
      alert("Failed to add user.");
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("role", form.role);
      formData.append("is_verified", form.is_verified);
      if (form.password) formData.append("new_password", form.password);

      await authAxios.put(`/users/by-username/${selectedUser.username}`, formData);
      window.location.reload();
    } catch (err) {
      alert("Failed to update user.");
    }
  }

  async function handleDelete(username) {
    if (!window.confirm("Delete this user?")) return;
    try {
      await authAxios.delete(`/users/by-username/${username}`);
      setUsers((prev) => prev.filter((u) => u.username !== username));
    } catch (err) {
      alert("Failed to delete user.");
    }
  }

const renderFormFields = () => (
  <>
    <TextField
      name="username"
      label="Email"
      value={form.username}
      onChange={handleChange}
      fullWidth
      disabled={!!selectedUser}
    />

    <TextField
      name="password"
      label="Password"
      type="password"
      value={form.password}
      onChange={handleChange}
      fullWidth
    />

    <TextField
      select
      name="role"
      label="Role"
      value={form.role}
      onChange={handleChange}
      fullWidth
    >
      <MenuItem value="admin">Admin</MenuItem>
      <MenuItem value="supervisor">Supervisor</MenuItem>
    </TextField>

    <TextField
      select
      name="is_verified"
      label="Is Verified"
      value={form.is_verified ? "true" : "false"}
      onChange={(e) => setForm(prev => ({ ...prev, is_verified: e.target.value === "true" }))}
      fullWidth
    >
      <MenuItem value="true">True</MenuItem>
      <MenuItem value="false">False</MenuItem>
    </TextField>
  </>
);

  return (
    <Box sx={{ minHeight: "100vh", width: "100vw", backgroundColor: "#f7fafd" }}>
      <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", py: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">Users</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddOpen} sx={{ bgcolor: "#1976d2" }}>
            Add User
          </Button>
        </Stack>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SearchIcon color="action" />
            <TextField label="Search by email or role" variant="standard" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} />
          </Box>
        </Paper>
        <Paper>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography>Loading users...</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ p: 4 }}>No users found.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ background: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.is_verified ? "Yes" : "No"}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleEditOpen(user)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(user.username)}>
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

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {renderFormFields()}
            <DialogActions>
              <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Save</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleEditSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {renderFormFields()}
            <DialogActions>
              <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Update</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}