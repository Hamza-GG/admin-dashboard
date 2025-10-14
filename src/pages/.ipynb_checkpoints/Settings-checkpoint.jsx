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
  Autocomplete,
  Chip,
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

// Keep these values exactly as your backend expects
const PRIORITY_OPTIONS = ["Urgent", "High", "Medium", "Low", "Info", "None"];

function priorityColor(p) {
  switch (p) {
    case "Urgent":
      return "error";
    case "High":
      return "warning";
    case "Medium":
      return "info";
    case "Low":
      return "success";
    case "Info":
      return "secondary";
    default:
      return "default";
  }
}

export default function Settings() {
  // -------- Actions ----------
  const [actions, setActions] = useState([]);
  const [createActionName, setCreateActionName] = useState("");
  const [loadingActions, setLoadingActions] = useState(true);

  // -------- Users (assignees) -------
  const [users, setUsers] = useState([]); // [{id, username, role, ...}]
  const [loadingUsers, setLoadingUsers] = useState(true);

  // -------- Rules ------------
  const [createForm, setCreateForm] = useState({
    rule_id: "",
    city: "",
    field: "",
    option_value: "",
    action: "",
    priority: "None", // default
    second_level_action: "",
    second_level_threshold: "", // keep as string for input; cast before sending
  });
  const [createAssignee, setCreateAssignee] = useState(null); // user object or null

  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [filterRuleId, setFilterRuleId] = useState("");
  const [filterField, setFilterField] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // -------- Edit/Delete dialogs ----
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editAssignee, setEditAssignee] = useState(null);
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

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await authAxios.get("/users");
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
      showAlert("error", "Failed to load users.");
    } finally {
      setLoadingUsers(false);
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
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRuleId, filterField]);

  const uniqueRuleIds = useMemo(
    () => Array.from(new Set(rules.map((r) => r.rule_id))).sort((a, b) => a - b),
    [rules]
  );

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  // ====== Actions: create ======
  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!createActionName.trim()) {
      showAlert("warning", "Action name is required.");
      return;
    }
    try {
      await authAxios.post("/actions", { name: createActionName.trim() });
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
    const {
      rule_id,
      city,
      field,
      option_value,
      action,
      priority,
      second_level_action,
      second_level_threshold,
    } = createForm;

    if (!rule_id || !city || !field || !option_value || !action) {
      showAlert("warning", "Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        rule_id: Number(rule_id),
        city,
        field,
        option_value,
        action, // text action
        priority, // text priority
        assignee_user_id: createAssignee?.id ?? null,
      };

      // Only include 2nd level fields if provided
      if (second_level_action && second_level_action.trim()) {
        payload.second_level_action = second_level_action.trim();
      }
      if (second_level_threshold !== "" && !Number.isNaN(Number(second_level_threshold))) {
        payload.second_level_threshold = Number(second_level_threshold);
      }

      await authAxios.post("/inspection-rules", payload);
      showAlert("success", "Rule created.");
      setCreateForm({
        rule_id: "",
        city: "",
        field: "",
        option_value: "",
        action: "",
        priority: "None",
        second_level_action: "",
        second_level_threshold: "",
      });
      setCreateAssignee(null);
      fetchRules();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to create rule.";
      showAlert("error", msg);
    }
  };

  // ====== Rules: edit ======
  const openEdit = (row) => {
    // Normalize fields for editing UI
    setEditRow({
      ...row,
      priority: row.priority || "None",
      second_level_action: row.second_level_action || "",
      second_level_threshold:
        typeof row.second_level_threshold === "number" ? String(row.second_level_threshold) : "",
    });
    const u = row.assignee_user_id ? userById.get(row.assignee_user_id) : null;
    setEditAssignee(u || null);
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
        priority: editRow.priority || "None",
        assignee_user_id: editAssignee?.id ?? null, // allow clearing
      };

      // Include 2nd level fields only if user filled them (empty string removes them)
      if (editRow.second_level_action && editRow.second_level_action.trim()) {
        payload.second_level_action = editRow.second_level_action.trim();
      } else {
        payload.second_level_action = null;
      }

      if (editRow.second_level_threshold !== "") {
        const n = Number(editRow.second_level_threshold);
        payload.second_level_threshold = Number.isNaN(n) ? null : n;
      } else {
        payload.second_level_threshold = null;
      }

      await authAxios.put(`/inspection-rules/${editRow.id}`, payload);
      showAlert("success", "Rule updated.");
      setEditOpen(false);
      setEditRow(null);
      setEditAssignee(null);
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
            <Typography variant="subtitle1" fontWeight={600}>
              Create Action
            </Typography>
            <Stack component="form" spacing={2} onSubmit={handleCreateAction}>
              <TextField
                label="Action name"
                value={createActionName}
                onChange={(e) => setCreateActionName(e.target.value)}
                fullWidth
                size="small"
              />
              <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                Create Action
              </Button>
            </Stack>
          </Paper>

          {/* Create Rule */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Create Rule
            </Typography>
            <Stack component="form" spacing={2} onSubmit={handleCreateRule}>
              <TextField
                label="Rule ID"
                type="number"
                value={createForm.rule_id}
                onChange={(e) => setCreateForm((s) => ({ ...s, rule_id: e.target.value }))}
                fullWidth
                size="small"
              />
              <TextField
                label="City"
                value={createForm.city}
                onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))}
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Field</InputLabel>
                <Select
                  value={createForm.field}
                  onChange={(e) => setCreateForm((s) => ({ ...s, field: e.target.value }))}
                  label="Field"
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
              />
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={createForm.action}
                  onChange={(e) => setCreateForm((s) => ({ ...s, action: e.target.value }))}
                  label="Action"
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.name}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Priority */}
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm((s) => ({ ...s, priority: e.target.value }))}
                  label="Priority"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Second-level Action (optional) */}
              <TextField
                label="Second-level Action (optional)"
                value={createForm.second_level_action}
                onChange={(e) => setCreateForm((s) => ({ ...s, second_level_action: e.target.value }))}
                fullWidth
                size="small"
                placeholder="e.g. Escalate to compliance"
              />

              {/* Second-level Threshold (optional) */}
              <TextField
                label="Second-level Threshold (optional)"
                type="number"
                value={createForm.second_level_threshold}
                onChange={(e) => setCreateForm((s) => ({ ...s, second_level_threshold: e.target.value }))}
                fullWidth
                size="small"
                placeholder="e.g. 3"
              />

              {/* Assignee select (optional) */}
              <Autocomplete
                options={users}
                loading={loadingUsers}
                getOptionLabel={(o) => o?.username ?? ""}
                value={createAssignee}
                onChange={(_, v) => setCreateAssignee(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assignee (optional)"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Button type="submit" variant="contained">
                Create Rule
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Right column: Manage Rules */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Manage Rules
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Filter by Rule ID"
                  size="small"
                  value={filterRuleId}
                  onChange={(e) => setFilterRuleId(e.target.value)}
                  sx={{ width: 160 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Filter by Field</InputLabel>
                  <Select
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value)}
                    label="Filter by Field"
                  >
                    <MenuItem value="">All</MenuItem>
                    {ALLOWED_FIELDS.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={fetchRules}>
                  Apply
                </Button>
              </Stack>
            </Stack>

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
                      <TableCell>Priority</TableCell>
                      <TableCell>2nd Action</TableCell>
                      <TableCell>2nd Threshold</TableCell>
                      <TableCell>Assignee</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.rule_id}</TableCell>
                        <TableCell>{row.city}</TableCell>
                        <TableCell>{row.field}</TableCell>
                        <TableCell>{row.option_value}</TableCell>
                        <TableCell>{row.action}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.priority || "None"}
                            color={priorityColor(row.priority)}
                            variant={row.priority && row.priority !== "None" ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.second_level_action || "—"}
                        </TableCell>
                        <TableCell>
                          {typeof row.second_level_threshold === "number" ? row.second_level_threshold : "—"}
                        </TableCell>
                        <TableCell>{row.assignee_username || "—"}</TableCell>
                        <TableCell>
                          {row.created_at ? new Date(row.created_at).toLocaleString("fr-MA") : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton onClick={() => openEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => confirmDelete(row)}>
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
                  label="Field"
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
              />
              <FormControl>
                <InputLabel>Action</InputLabel>
                <Select
                  value={editRow.action}
                  onChange={(e) => setEditRow((s) => ({ ...s, action: e.target.value }))}
                  label="Action"
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.name}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Priority */}
              <FormControl>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editRow.priority || "None"}
                  onChange={(e) => setEditRow((s) => ({ ...s, priority: e.target.value }))}
                  label="Priority"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Second-level Action */}
              <TextField
                label="Second-level Action (optional)"
                value={editRow.second_level_action}
                onChange={(e) => setEditRow((s) => ({ ...s, second_level_action: e.target.value }))}
                placeholder="e.g. Escalate to compliance"
              />

              {/* Second-level Threshold */}
              <TextField
                label="Second-level Threshold (optional)"
                type="number"
                value={editRow.second_level_threshold}
                onChange={(e) => setEditRow((s) => ({ ...s, second_level_threshold: e.target.value }))}
                placeholder="e.g. 3"
              />

              {/* Assignee (optional) */}
              <Autocomplete
                options={users}
                loading={loadingUsers}
                getOptionLabel={(o) => o?.username ?? ""}
                value={editAssignee}
                onChange={(_, v) => setEditAssignee(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assignee (optional)"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
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
          Are you sure you want to delete rule #{toDelete?.id}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={alert.open} autoHideDuration={3500} onClose={closeAlert}>
        <Alert onClose={closeAlert} severity={alert.severity} variant="filled">
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}