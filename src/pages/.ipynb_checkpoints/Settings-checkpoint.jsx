import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
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
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RuleIcon from "@mui/icons-material/Rule";
import BoltIcon from "@mui/icons-material/Bolt";
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
function Sidebar({ activeTab, onChange }) {
  return (
    <List dense disablePadding>
      <ListItemButton selected={activeTab === "actions"} onClick={() => onChange("actions")}>
        <BoltIcon sx={{ mr: 1 }} />
        <ListItemText primary="Actions" />
      </ListItemButton>
      <ListItemButton selected={activeTab === "rules"} onClick={() => onChange("rules")}>
        <RuleIcon sx={{ mr: 1 }} />
        <ListItemText primary="Rules" />
      </ListItemButton>
      <ListItemButton selected={activeTab === "users"} onClick={() => onChange("users")}>
        <PeopleAltIcon sx={{ mr: 1 }} />
        <ListItemText primary="Users" />
      </ListItemButton>
    </List>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("actions"); // "actions" | "rules" | "users"

  // -------- Actions ----------
  const [actions, setActions] = useState([]);
  const [createActionName, setCreateActionName] = useState("");
  const [loadingActions, setLoadingActions] = useState(true);

  // -------- Users (assignees & Users tab) -------
  const [users, setUsers] = useState([]); // [{id, username, role, is_verified}]
  const [loadingUsers, setLoadingUsers] = useState(true);

  // -------- Rules ------------
  const [createForm, setCreateForm] = useState({
    rule_id: "",
    city: "",
    field: "",
    option_value: "",
    action: "",
    priority: "None",
    second_level_action: "",
    second_level_threshold: "",
  });
  const [createAssignee, setCreateAssignee] = useState(null); // user object or null

  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [filterRuleId, setFilterRuleId] = useState("");
  const [filterField, setFilterField] = useState("");
  const [pageRules, setPageRules] = useState(0);
  const [rppRules, setRppRules] = useState(10);

  // -------- Users tab state ----
  const [userPage, setUserPage] = useState(0);
  const [userRpp, setUserRpp] = useState(10);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserRow, setEditUserRow] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // -------- Rule Edit/Delete dialogs ----
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

  // Load per tab to keep things lighter
  useEffect(() => {
    if (activeTab === "actions") fetchActions();
    if (activeTab === "rules") {
      fetchActions(); // needed for action dropdowns
      fetchUsers();   // needed for assignee lists
      fetchRules();
    }
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "rules") fetchRules();
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
  const openEditRule = (row) => {
    setEditRow({
      ...row,
      priority: row.priority || "None",
      second_level_action: (row.second_level_action ?? row.escalate_action) || "",
      second_level_threshold:
        typeof (row.second_level_threshold ?? row.escalate_threshold) === "number"
          ? String(row.second_level_threshold ?? row.escalate_threshold)
          : "",
    });
    const u = row.assignee_user_id ? userById.get(row.assignee_user_id) : null;
    setEditAssignee(u || null);
    setEditOpen(true);
  };

  const saveEditRule = async () => {
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
  const confirmDeleteRule = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const doDeleteRule = async () => {
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

  // ===== Users tab: edit user =====
  const openEditUser = (u) => {
    setEditUserRow({ ...u, new_password: "" });
    setNewPassword("");
    setEditUserOpen(true);
  };

  const saveUser = async () => {
    try {
      const form = new FormData();
      if (editUserRow.role) form.append("role", editUserRow.role);
      if (typeof editUserRow.is_verified === "boolean") {
        form.append("is_verified", String(editUserRow.is_verified));
      }
      if (newPassword) form.append("new_password", newPassword);

      await authAxios.put(`/users/by-username/${encodeURIComponent(editUserRow.username)}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showAlert("success", "User updated.");
      setEditUserOpen(false);
      setEditUserRow(null);
      setNewPassword("");
      fetchUsers();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to update user.";
      showAlert("error", msg);
    }
  };

  const deleteUser = async (u) => {
    try {
      await authAxios.delete(`/users/by-username/${encodeURIComponent(u.username)}`);
      showAlert("success", "User deleted.");
      fetchUsers();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to delete user.";
      showAlert("error", msg);
    }
  };

  // ===== Helpers for display =====
  const renderSecondAction = (row) =>
    (row.second_level_action ?? row.escalate_action) || "—";

  const renderSecondThreshold = (row) => {
    const v = row.second_level_threshold ?? row.escalate_threshold;
    return typeof v === "number" ? v : "—";
  };

  // ====== Render panes ======

  const ActionsPane = (
    <Paper sx={{ p: 2, width: "100%" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Actions
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
        <TextField
          label="Action name"
          value={createActionName}
          onChange={(e) => setCreateActionName(e.target.value)}
          size="small"
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateAction}>
          Create Action
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ width: "100%" }}>
        {loadingActions ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell width={80}>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell width={140} align="right">Created By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actions.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.id}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell align="right">{a.created_by ?? "—"}</TableCell>
                </TableRow>
              ))}
              {actions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No actions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Paper>
  );

  const RulesPane = (
  <Stack spacing={2} sx={{ width: "100%", flex: 1, minWidth: 0 }}>
      {/* Create Rule */}
      <Paper sx={{ p: 2, width: "100%" }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Create Rule
        </Typography>
        <Stack component="form" spacing={2} onSubmit={handleCreateRule}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Rule ID"
              type="number"
              value={createForm.rule_id}
              onChange={(e) => setCreateForm((s) => ({ ...s, rule_id: e.target.value }))}
              size="small"
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="City"
              value={createForm.city}
              onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={createForm.field}
                onChange={(e) => setCreateForm((s) => ({ ...s, field: e.target.value }))}
                label="Field"
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
              size="small"
              sx={{ minWidth: 200 }}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={createForm.action}
                onChange={(e) => setCreateForm((s) => ({ ...s, action: e.target.value }))}
                label="Action"
              >
                {actions.map((a) => (
                  <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={createForm.priority}
                onChange={(e) => setCreateForm((s) => ({ ...s, priority: e.target.value }))}
                label="Priority"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="2nd-level Action (optional)"
              value={createForm.second_level_action}
              onChange={(e) => setCreateForm((s) => ({ ...s, second_level_action: e.target.value }))}
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
              placeholder="e.g. Escalate to compliance"
            />

            <TextField
              label="2nd-level Threshold (optional)"
              type="number"
              value={createForm.second_level_threshold}
              onChange={(e) => setCreateForm((s) => ({ ...s, second_level_threshold: e.target.value }))}
              size="small"
              sx={{ minWidth: 180 }}
              placeholder="e.g. 3"
            />
          </Stack>

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
            sx={{ maxWidth: 420 }}
          />

          <Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRule}>
              Create Rule
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Manage Rules */}
      <Paper sx={{ p: 2, width: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Active Rules</Typography>
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
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={fetchRules}>
              Apply
            </Button>
          </Stack>
        </Stack>

        <TableContainer sx={{ maxHeight: 520, width: "100%" }}>
          {loadingRules ? (
            <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small" stickyHeader sx={{ width: "100%" }}>
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
                {rules.slice(pageRules * rppRules, pageRules * rppRules + rppRules).map((row) => (
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
                    <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word", maxWidth: 420 }}>
                      {renderSecondAction(row)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      {renderSecondThreshold(row)}
                    </TableCell>
                    <TableCell>{row.assignee_username || "—"}</TableCell>
                    <TableCell>
                      {row.created_at ? new Date(row.created_at).toLocaleString("fr-MA") : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => openEditRule(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => confirmDeleteRule(row)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingRules && rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No rules found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        <TablePagination
          component="div"
          count={rules.length}
          page={pageRules}
          onPageChange={(_, p) => setPageRules(p)}
          rowsPerPage={rppRules}
          onRowsPerPageChange={(e) => {
            setRppRules(parseInt(e.target.value, 10));
            setPageRules(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Edit Rule Dialog */}
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
                  label="Action"
                >
                  {actions.map((a) => (
                    <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editRow.priority || "None"}
                  onChange={(e) => setEditRow((s) => ({ ...s, priority: e.target.value }))}
                  label="Priority"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="2nd-level Action (optional)"
                value={editRow.second_level_action}
                onChange={(e) => setEditRow((s) => ({ ...s, second_level_action: e.target.value }))}
                placeholder="e.g. Escalate to compliance"
              />

              <TextField
                label="2nd-level Threshold (optional)"
                type="number"
                value={editRow.second_level_threshold}
                onChange={(e) => setEditRow((s) => ({ ...s, second_level_threshold: e.target.value }))}
                placeholder="e.g. 3"
              />

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
          <Button variant="contained" onClick={saveEditRule}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Rule confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Rule?</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete rule #{toDelete?.id}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDeleteRule}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );

  const UsersPane = (
    <Paper sx={{ p: 2, width: "100%" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Users
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ width: "100%" }}>
        {loadingUsers ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader size="small" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell>Username (email)</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .slice(userPage * userRpp, userPage * userRpp + userRpp)
                .map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.is_verified ? "Yes" : "No"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => openEditUser(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => deleteUser(u)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {!loadingUsers && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <TablePagination
        component="div"
        count={users.length}
        page={userPage}
        onPageChange={(_, p) => setUserPage(p)}
        rowsPerPage={userRpp}
        onRowsPerPageChange={(e) => {
          setUserRpp(parseInt(e.target.value, 10));
          setUserPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Edit user dialog */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          {editUserRow && (
            <Stack spacing={2}>
              <TextField label="Username" value={editUserRow.username} InputProps={{ readOnly: true }} />
              <FormControl>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={editUserRow.role || ""}
                  onChange={(e) => setEditUserRow((s) => ({ ...s, role: e.target.value }))}
                >
                  <MenuItem value="admin">admin</MenuItem>
                  <MenuItem value="supervisor">supervisor</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Verified</InputLabel>
                <Select
                  label="Verified"
                  value={editUserRow.is_verified ? "true" : "false"}
                  onChange={(e) => setEditUserRow((s) => ({ ...s, is_verified: e.target.value === "true" }))}
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="New password (optional)"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Leave blank to keep current password"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveUser}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return (
  <Box
    sx={{
      // Break out of any parent Container maxWidth to use full viewport width
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      width: "100vw",

      bgcolor: "#f7fafd",
      minHeight: "calc(100vh - 64px)",
      px: { xs: 2, md: 4 },
      py: 3,
    }}
  >
    <Typography variant="h4" fontWeight="bold" gutterBottom>
      Settings
    </Typography>

    <Stack
  direction="row"
  spacing={3}
  alignItems="flex-start"
  sx={{ width: "100vw", maxWidth: "100vw" }}
>
      {/* Sidebar */}
      <Paper sx={{ width: 280, flexShrink: 0 }}>
        <Sidebar activeTab={activeTab} onChange={setActiveTab} />
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: "100%" }}>
        <Box sx={{ width: "100%" }}>
          {activeTab === "actions" && <Box sx={{ width: "100%" }}>{ActionsPane}</Box>}
          {activeTab === "rules" && <Box sx={{ width: "100%" }}>{RulesPane}</Box>}
          {activeTab === "users" && <Box sx={{ width: "100%" }}>{UsersPane}</Box>}
        </Box>
      </Box>
    </Stack>

    {/* Snackbar */}
    <Snackbar open={alert.open} autoHideDuration={3500} onClose={closeAlert}>
      <Alert onClose={closeAlert} severity={alert.severity} variant="filled">
        {alert.message}
      </Alert>
    </Snackbar>
  </Box>
);
}