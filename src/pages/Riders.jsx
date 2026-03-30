import React, { useEffect, useMemo, useRef, useState } from "react";
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SearchIcon from "@mui/icons-material/Search";

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const PAGE_SIZE = 200;
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const fetchRiders = async (q) => {
    // Cancel any in-flight request
    try {
      abortRef.current?.abort?.();
    } catch (_) {}

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMsg("");

    try {
      // Always search (no default fetch).
      // Send a few common param names so different backends can understand it
      const params = { q, search: q, query: q, limit: PAGE_SIZE };

      // NOTE: this assumes backend supports `limit` and optional `q`.
      const res = await authAxios.get("/riders", {
        params,
        signal: controller.signal,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      const qq = (q || "").toLowerCase();

      // Safety net: if backend returns ALL riders, we still only show matches.
      const filteredData = !qq
        ? []
        : data
            .filter((r) =>
              [
                r.rider_id,
                r.first_name,
                r.first_last_name,
                r.id_number,
                r.city_code,
                r.vehicle_type,
                r.plate_number,
                r.box_serial_number,
              ]
                .map((v) => (v ? v.toString().toLowerCase() : ""))
                .some((v) => v.includes(qq))
            )
            .slice(0, PAGE_SIZE);

      setRiders(filteredData);

      // Optional hint if the backend is ignoring params and returning too much data.
      if (qq && data.length > PAGE_SIZE && filteredData.length === PAGE_SIZE) {
        setErrorMsg(
          "Showing first 200 matches. Backend may be returning all riders; consider implementing server-side search for speed."
        );
      }
    } catch (error) {
      // If request was aborted, ignore
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return;
      }

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      // No fallback: this page is search-only.
      setRiders([]);
      setErrorMsg(
        "Search endpoint not available. Backend must support GET /riders?q=...&limit=..."
      );
      console.error("Fetch riders error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Search-only mode: do not load riders on mount.
    return () => {
      try {
        abortRef.current?.abort?.();
      } catch (_) {}
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Debounced server search
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = search.trim();

    debounceRef.current = setTimeout(() => {
      // Search-only mode:
      // - empty search => show nothing
      // - short search (<2) => show nothing
      if (!q) {
        setRiders([]);
        setErrorMsg("");
        setLoading(false);
        return;
      }

      if (q.length < 2) {
        setRiders([]);
        setErrorMsg("");
        setLoading(false);
        return;
      }

      fetchRiders(q);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => riders, [riders]);

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
    setForm({ ...rider, joined_at: rider.joined_at?.slice(0, 10) || "" });
    setOpenEdit(true);
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.rider_id) delete data.rider_id;
      else data.rider_id = Number(data.rider_id);
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
      if (data.rider_id) data.rider_id = Number(data.rider_id);
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

  async function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await authAxios.post("/riders/upload-csv", formData);
      window.location.reload();
    } catch (error) {
      alert("CSV upload failed.");
    }
  }

  const renderFormFields = () => (
    <>
      {Object.entries(emptyForm).map(([key]) => (
        <TextField
          key={key}
          name={key}
          label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          value={form[key]}
          onChange={handleChange}
          type={key === 'joined_at' ? 'date' : 'text'}
          InputLabelProps={key === 'joined_at' ? { shrink: true } : {}}
          fullWidth
        />
      ))}
    </>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f4f8" }}>
      <Box sx={{ width: "100%", maxWidth: 1300, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5, color: "text.primary" }}>
              Riders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gérer, rechercher et importer des riders
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddOpen}
            >
              Add Rider
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
            >
              Upload CSV
              <input type="file" accept=".csv" hidden onChange={handleCSVUpload} />
            </Button>
          </Stack>
        </Stack>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <SearchIcon sx={{ color: "text.secondary", ml: 0.5 }} />
          <TextField
            label="Rechercher un rider…"
            variant="standard"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: false }}
          />
        </Paper>
        {errorMsg ? (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>{errorMsg}</Typography>
        ) : search.trim().length < 2 ? (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Start typing to search for a rider (minimum 2 characters).
          </Typography>
        ) : (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Showing matching riders.
          </Typography>
        )}
        <Paper elevation={2}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography>Loading riders{search.trim() ? " (searching...)" : "..."}</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ p: 4 }}>
              {search.trim().length < 2
                ? "Search for a rider to see results."
                : "No riders found."}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ background: "#f5f5f5" }}>
                  <TableRow>
                    {Object.keys(emptyForm).map((key) => (
                      <TableCell key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                    ))}
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((rider) => (
                    <TableRow key={rider.rider_id}>
                      {Object.keys(emptyForm).map((key) => (
                        <TableCell key={key}>{key === 'joined_at' ? rider[key]?.slice(0, 10) : rider[key]}</TableCell>
                      ))}
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

      {/* ADD DIALOG */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Rider</DialogTitle>
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

      {/* EDIT DIALOG */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rider</DialogTitle>
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