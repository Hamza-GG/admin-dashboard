import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  Snackbar,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import authAxios from "../utils/authAxios";

const ALLOWED_FIELDS = [
  "helmet",
  "box",
  "account",
  "parking",
  "appearance",
  "driving",
  "mfc_status",
  "courier_behavior",
];

export default function Settings() {
  // -------- Actions state ----------
  const [actions, setActions] = useState([]);
  const [createActionName, setCreateActionName] = useState("");
  const [loadingActions, setLoadingActions] = useState(true);

  // -------- Rules state ------------
  const [createForm, setCreateForm] = useState({
    rule_id: "",
    city: "",
    field: "",
    option_value: "",
    action: "", // <-- action name, not id
  });
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [filterRuleId, setFilterRuleId] = useState("");
  const [filterField, setFilterField] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // -------- Edit/Delete dialogs ----
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // -------- Snackbars --------------
  const [alert, setAlert] = useState({ open: false, severity: "success", message: "" });
  const showAlert = (severity, message) => setAlert({ open: true, severity, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  // ===== API loaders =====
  const fetchActions = async () => {
    try {
      setLoadingActions(true);
      const res = await authAxios.get("/actions");
      setActions(res.data || []);
    } catch (e) {
      console.error(e);
      showAlert("error", "Failed to load actions.");
    } finally {
      setLoadingActions(false);
    }
  };

  const fetchRules = async () => {
    try {
      setLoadingRules(true);
      const params = {};
      if (filterRuleId) params.rule_id = filterRuleId;
      if (filterField) params.field = filterField;
      const res = await authAxios.get("/inspection-rules", { params });
      setRules(res.data || []);
    } catch (e) {
      console.error(e);
      showAlert("error", "Failed to fetch rules.");
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchRules();
  }, [filterRuleId, filterField]);

  const uniqueRuleIds = useMemo(
    () => Array.from(new Set(rules.map((r) => r.rule_id))).sort((a, b) => a - b),
    [rules]
  );

  // ====== Actions: create ======
  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!createActionName.trim()) {
      showAlert("warning", "Action name is required.");
      return;
    }
    try {
      const res = await authAxios.post("/actions", { name: createActionName.trim() });
      showAlert("success", "Action created.");
      setCreateActionName("");
      fetchActions();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to create action.";
      showAlert("error", msg);
    }
  };

  // ====== Rules: create ======
  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!createForm.rule_id || !createForm.city || !createForm.field || !createForm.option_value || !createForm.action) {
      showAlert("warning", "Please fill all fields.");
      return;
    }
    try {
      const payload = {
        rule_id: Number(createForm.rule_id),
        city: createForm.city,
        field: createForm.field,
        option_value: createForm.option_value,
        action: createForm.action,
      };
      await authAxios.post("/inspection-rules", payload);
      showAlert("success", "Rule created.");
      setCreateForm({ rule_id: "", city: "", field: "", option_value: "", action: "" });
      fetchRules();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to create rule.";
      showAlert("error", msg);
    }
  };

  // ====== Rules: edit ======
  const openEdit = (row) => {
    setEditRow({ ...row });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      const payload = {
        rule_id: Number(editRow.rule_id),
        city: editRow.city,
        field: editRow.field,
        option_value: editRow.option_value,
        action: editRow.action,
      };
      await authAxios.put(`/inspection-rules/${editRow.id}`, payload);
      showAlert("success", "Rule updated.");
      setEditOpen(false);
      setEditRow(null);
      fetchRules();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to update rule.";
      showAlert("error", msg);
    }
  };

  // ====== Rules: delete ======
  const confirmDelete = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    try {
      await authAxios.delete(`/inspection-rules/${toDelete.id}`);
      showAlert("success", "Rule deleted.");
      setDeleteOpen(false);
      setToDelete(null);
      fetchRules();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to delete rule.";
      showAlert("error", msg);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f7fafd", minHeight: "calc(100vh - 64px)" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Left column: Actions + Create Rule */}
        <Grid item xs={12} md={4}>
          {/* Create Action */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600}>Create Action</Typography>
            <Stack component="form" spacing={2} onSubmit={handleCreateAction}>
              <TextField
                label="Action name"
                value={createActionName}
                onChange={(e) => setCreateActionName(e.target.value)}
                fullWidth
                size="small"
              />
              <Button type="submit" variant="contained">Create Action</Button>
            </Stack>
          </Paper>

          {/* Create Rule */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Create Rule</Typography>
            <Stack component="form" spacing={2} onSubmit={handleCreateRule}>
              <TextField
                label="Rule ID"
                type="number"
                value={createForm.rule_id}
                onChange={(e) => setCreateForm((s) => ({ ...s, rule_id: e.target.value }))}
                fullWidth size="small"
              />
              <TextField
                label="City"
                value={createForm.city}
                onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))}
                fullWidth size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Field</InputLabel>
                <Select
                  value={createForm.field}
                  onChange={(e) => setCreateForm((s) => ({ ...s, field: e.target.value }))}
                >
                  {ALLOWED_FIELDS.map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Option"
                value={createForm.option_value}
                onChange={(e) => setCreateForm((s) => ({ ...s, option_value: e.target.value }))}
                fullWidth size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={createForm.action}
                  onChange={(e) => setCreateForm((s) => ({ ...s, action: e.target.value }))}
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained">Create Rule</Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right column: Manage Rules */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Manage Rules</Typography>
            <TableContainer sx={{ maxHeight: 520 }}>
              {loadingRules ? (
                <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Rule ID</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>Field</TableCell>
                      <TableCell>Option</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.rule_id}</TableCell>
                        <TableCell>{row.city}</TableCell>
                        <TableCell>{row.field}</TableCell>
                        <TableCell>{row.option_value}</TableCell>
                        <TableCell>{row.action}</TableCell>
                        <TableCell>
                          {row.created_at ? new Date(row.created_at).toLocaleString("fr-MA") : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton color="error" onClick={() => confirmDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
            <TablePagination
              component="div"
              count={rules.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
        <DialogTitle>Edit Rule</DialogTitle>
        <DialogContent dividers>
          {editRow && (
            <Stack spacing={2}>
              <TextField
                label="Rule ID"
                type="number"
                value={editRow.rule_id}
                onChange={(e) => setEditRow((s) => ({ ...s, rule_id: e.target.value }))}
              />
              <TextField
                label="City"
                value={editRow.city}
                onChange={(e) => setEditRow((s) => ({ ...s, city: e.target.value }))}
              />
              <FormControl>
                <InputLabel>Field</InputLabel>
                <Select
                  value={editRow.field}
                  onChange={(e) => setEditRow((s) => ({ ...s, field: e.target.value }))}
                >
                  {ALLOWED_FIELDS.map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Option"
                value={editRow.option_value}
                onChange={(e) => setEditRow((s) => ({ ...s, option_value: e.target.value }))}
              />
              <FormControl>
                <InputLabel>Action</InputLabel>
                <Select
                  value={editRow.action}
                  onChange={(e) => setEditRow((s) => ({ ...s, action: e.target.value }))}
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Rule?</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete rule #{toDelete?.id}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={alert.open} autoHideDuration={3500} onClose={closeAlert}>
        <Alert onClose={closeAlert} severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}