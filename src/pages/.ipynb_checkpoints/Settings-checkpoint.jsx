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
  const [actions, setActions] = useState([]); // [{id, name}]
  const [createActionName, setCreateActionName] = useState("");
  const [loadingActions, setLoadingActions] = useState(true);

  // -------- Rules state ------------
  const [createForm, setCreateForm] = useState({
    rule_id: "",
    field: "",
    option_value: "",
    action_id: "", // <-- now stores selected action id
  });
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [filterRuleId, setFilterRuleId] = useState("");
  const [filterField, setFilterField] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // -------- Edit/Delete dialogs ----
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null); // { id, rule_id, field, option_value, action_id }
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
      // Expecting [{id, name}] from backend
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
      const res = await authAxios.get("/rules", { params });
      // Expecting each rule item includes {id, rule_id, field, option_value, action_id, action_name?, created_at}
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
  }, []);

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRuleId, filterField]);

  // Derived: quick filters
  const uniqueRuleIds = useMemo(
    () => Array.from(new Set(rules.map((r) => r.rule_id))).sort((a, b) => a - b),
    [rules]
  );

  const actionNameById = useMemo(() => {
    const map = new Map();
    actions.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [actions]);

  // ====== Actions: create ======
  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!createActionName.trim()) {
      showAlert("warning", "Action name is required.");
      return;
    }
    try {
      const payload = { name: createActionName.trim() };
      const res = await authAxios.post("/actions", payload);
      showAlert("success", "Action created.");
      setCreateActionName("");
      // refresh actions so dropdown gets the new item
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
    if (!createForm.rule_id || !createForm.field || !createForm.option_value || !createForm.action_id) {
      showAlert("warning", "Please fill all fields.");
      return;
    }
    try {
      const payload = {
        rule_id: Number(createForm.rule_id),
        field: createForm.field,
        option_value: createForm.option_value,
        action_id: Number(createForm.action_id),
      };
      await authAxios.post("/rules", payload);
      showAlert("success", "Rule created.");
      setCreateForm({ rule_id: "", field: "", option_value: "", action_id: "" });
      fetchRules();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to create rule (maybe it already exists).";
      showAlert("error", msg);
    }
  };

  // ====== Rules: edit ======
  const openEdit = (row) => {
    // normalize incoming row: if backend returns action_name but not action_id, ensure action_id exists
    setEditRow({ ...row });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      const payload = {
        rule_id: Number(editRow.rule_id),
        field: editRow.field,
        option_value: editRow.option_value,
        action_id: Number(editRow.action_id),
      };
      await authAxios.put(`/rules/${editRow.id}`, payload);
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
      await authAxios.delete(`/rules/${toDelete.id}`);
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
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f7fafd", minHeight: "calc(100vh - 64px)" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create reusable <strong>Actions</strong>, then attach them to <strong>Rules</strong> per field/option. (Admin only)
      </Typography>

      <Grid container spacing={3}>
        {/* Left column: Create Action + Create Rule */}
        <Grid item xs={12} md={4}>
          {/* Create Action */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <AddIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Create Action
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack component="form" spacing={2} onSubmit={handleCreateAction}>
              <TextField
                label="Action name"
                value={createActionName}
                onChange={(e) => setCreateActionName(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. Call courier, Notify city lead, Suspend account, ..."
              />
              <Button type="submit" variant="contained">Create Action</Button>
            </Stack>
            {loadingActions && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="caption" color="text.secondary">Loading actions…</Typography>
              </Stack>
            )}
            {!loadingActions && actions.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                No actions yet. Create one above, then use it in rules.
              </Typography>
            )}
          </Paper>

          {/* Create Rule */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <AddIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Create Rule
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Stack component="form" spacing={2} onSubmit={handleCreateRule}>
              <TextField
                label="Rule ID"
                type="number"
                value={createForm.rule_id}
                onChange={(e) => setCreateForm((s) => ({ ...s, rule_id: e.target.value }))}
                fullWidth
                size="small"
                placeholder="e.g. 1"
              />

              <FormControl fullWidth size="small">
                <InputLabel id="field-label">Field</InputLabel>
                <Select
                  labelId="field-label"
                  label="Field"
                  value={createForm.field}
                  onChange={(e) => setCreateForm((s) => ({ ...s, field: e.target.value }))}
                >
                  {ALLOWED_FIELDS.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Option"
                value={createForm.option_value}
                onChange={(e) => setCreateForm((s) => ({ ...s, option_value: e.target.value }))}
                fullWidth
                size="small"
                placeholder="e.g. Non, Compte loué, etc."
              />

              <FormControl fullWidth size="small" disabled={loadingActions || actions.length === 0}>
                <InputLabel id="action-select-label">Action</InputLabel>
                <Select
                  labelId="action-select-label"
                  label="Action"
                  value={createForm.action_id}
                  onChange={(e) => setCreateForm((s) => ({ ...s, action_id: e.target.value }))}
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button type="submit" variant="contained" disabled={actions.length === 0}>
                Create Rule
              </Button>
              {actions.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Create an action first to enable this form.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Right column: Manage Rules */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <FilterAltIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Manage Rules
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {/* Filters */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="filter-ruleid">Rule ID</InputLabel>
                <Select
                  labelId="filter-ruleid"
                  label="Rule ID"
                  value={filterRuleId}
                  onChange={(e) => setFilterRuleId(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueRuleIds.map((rid) => (
                    <MenuItem key={rid} value={rid}>
                      {rid}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="filter-field">Field</InputLabel>
                <Select
                  labelId="filter-field"
                  label="Field"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {ALLOWED_FIELDS.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button onClick={fetchRules} variant="outlined">
                Refresh
              </Button>
            </Stack>

            {/* Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
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
                      <TableCell>Field</TableCell>
                      <TableCell>Option</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.rule_id}</TableCell>
                          <TableCell>{row.field}</TableCell>
                          <TableCell>{row.option_value}</TableCell>
                          <TableCell>
                            {/* Prefer backend-provided action_name; fall back to lookup */}
                            {row.action_name || actionNameById.get(row.action_id) || `#${row.action_id}`}
                          </TableCell>
                          <TableCell>
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString("fr-MA", {
                                  timeZone: "Africa/Casablanca",
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => confirmDelete(row)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rule</DialogTitle>
        <DialogContent dividers>
          {editRow && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Rule ID"
                type="number"
                value={editRow.rule_id}
                onChange={(e) => setEditRow((s) => ({ ...s, rule_id: e.target.value }))}
                fullWidth
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel id="edit-field-label">Field</InputLabel>
                <Select
                  labelId="edit-field-label"
                  label="Field"
                  value={editRow.field}
                  onChange={(e) => setEditRow((s) => ({ ...s, field: e.target.value }))}
                >
                  {ALLOWED_FIELDS.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Option"
                value={editRow.option_value}
                onChange={(e) => setEditRow((s) => ({ ...s, option_value: e.target.value }))}
                fullWidth
                size="small"
              />

              <FormControl fullWidth size="small" disabled={loadingActions || actions.length === 0}>
                <InputLabel id="edit-action-label">Action</InputLabel>
                <Select
                  labelId="edit-action-label"
                  label="Action"
                  value={editRow.action_id || ""}
                  onChange={(e) => setEditRow((s) => ({ ...s, action_id: e.target.value }))}
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Rule?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This will permanently delete rule <strong>#{toDelete?.id}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3500}
        onClose={closeAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeAlert} severity={alert.severity} variant="filled" sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}