import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Stack, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete, CircularProgress,
  Grid, Chip, Avatar, Divider
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UndoIcon from "@mui/icons-material/Undo";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import FilterListIcon from "@mui/icons-material/FilterList";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VisibilityIcon from "@mui/icons-material/Visibility";
import authAxios from "../utils/authAxios";

function initials(name = "") {
  const parts = String(name).split("@")[0].split(/[.\s_]/).filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || (String(name)[0] || "").toUpperCase();
}

function PriorityChip({ value }) {
  const label = value ?? "Normal";
  const map = {
    Urgent: { color: "error", icon: <PriorityHighIcon fontSize="small" /> },
    High: { color: "warning", icon: <PriorityHighIcon fontSize="small" /> },
    Normal: { color: "info", icon: null },
    Low: { color: "default", icon: null },
  };
  const conf = map[label] || map.Normal;
  return (
    <Chip
      size="small"
      color={conf.color}
      icon={conf.icon}
      label={label}
      variant={label === "Low" ? "outlined" : "filled"}
      sx={{ fontWeight: 600 }}
    />
  );
}

function StatusChip({ status, by }) {
  if (status === "done") {
    return (
      <Tooltip title={by ? `Done by ${by}` : "Done"}>
        <Chip
          size="small"
          color="success"
          icon={<DoneAllIcon fontSize="small" />}
          label="Done"
        />
      </Tooltip>
    );
  }
  return (
    <Chip
      size="small"
      color="warning"
      icon={<HourglassEmptyIcon fontSize="small" />}
      label="Pending"
      variant="outlined"
    />
  );
}

function AssigneeChip({ name }) {
  if (!name) return <Typography component="span" color="text.disabled">—</Typography>;
  return (
    <Chip
      size="small"
      avatar={<Avatar sx={{ width: 20, height: 20 }}>{initials(name)}</Avatar>}
      label={name}
      variant="outlined"
    />
  );
}

export default function ActionCenter() {
  const [rows, setRows] = useState([]); // matches (fetched)
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]); // [{id, username, role, ...}]
  const [loadingUsers, setLoadingUsers] = useState(true);

  // pagination
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  const [alert, setAlert] = useState({ open: false, severity: "success", message: "" });

  // confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [notes, setNotes] = useState("");

  // unconfirm dialog
  const [unconfirmOpen, setUnconfirmOpen] = useState(false);
  const [unconfirmItem, setUnconfirmItem] = useState(null);
  const [unconfirmReason, setUnconfirmReason] = useState("");

  // assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignItem, setAssignItem] = useState(null);
  const [assignee1, setAssignee1] = useState(null); // user obj or null
  const [assignee2, setAssignee2] = useState(null); // user obj or null
  const [assignSaving, setAssignSaving] = useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // details dialog (recap)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  // -------- FILTERS (client-side) --------
  const [fCity, setFCity] = useState("");
  const [fField, setFField] = useState("");
  const [fOption, setFOption] = useState("");
  const [fAction, setFAction] = useState("");
  const [fPriority, setFPriority] = useState(""); // "", "Urgent", "High", "Normal", "Low"
  const [fAssignee1, setFAssignee1] = useState(null); // user obj
  const [fAssignee2, setFAssignee2] = useState(null); // user obj
  const [fStatus, setFStatus] = useState(""); // "", "pending", "done"
  const [fStartDate, setFStartDate] = useState(""); // "YYYY-MM-DD"
  const [fEndDate, setFEndDate] = useState("");
  const [fRiderId, setFRiderId] = useState("");

  const show = (severity, message) => setAlert({ open: true, severity, message });
  const hide = () => setAlert(a => ({ ...a, open: false }));

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await authAxios.get("/users");
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
      show("error", e?.response?.data?.detail || "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/actions/matches");
      setRows(res.data || []);
    } catch (e) {
      console.error(e);
      show("error", e?.response?.data?.detail || "Failed to load matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, []);

  // Unique lists for filters (derived from fetched rows)
  const uniqueCities = useMemo(
    () => Array.from(new Set(rows.map(r => r.city).filter(Boolean))).sort(),
    [rows]
  );
  const uniqueFields = useMemo(
    () => Array.from(new Set(rows.map(r => r.field).filter(Boolean))).sort(),
    [rows]
  );
  const uniqueOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.option_value).filter(Boolean))).sort(),
    [rows]
  );
  const uniqueActions = useMemo(
    () => Array.from(new Set(rows.map(r => r.action_name).filter(Boolean))).sort(),
    [rows]
  );
  const uniquePriorities = useMemo(
    () => Array.from(new Set(rows.map(r => (r.priority ?? "Normal")).filter(Boolean))).sort(),
    [rows]
  );

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach(u => m.set(u.id, u));
    return m;
  }, [users]);

  // ---------- FILTERING ----------
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (fCity && r.city !== fCity) return false;
      if (fField && r.field !== fField) return false;
      if (fOption && r.option_value !== fOption) return false;
      if (fAction && r.action_name !== fAction) return false;
      if (fPriority && (r.priority ?? "Normal") !== fPriority) return false;

      // Assignee 1: match-level assignee1, else fallback to rule default
      if (fAssignee1) {
        const a1id = r.match_assignee_user_id ?? r.rule_assignee_user_id ?? null;
        if (a1id !== fAssignee1.id) return false;
      }

      // Assignee 2: only match-level
      if (fAssignee2) {
        if ((r.match_assignee2_user_id ?? null) !== fAssignee2.id) return false;
      }

      if (fStatus) {
        const isDone = r.status === "done";
        if (fStatus === "done" && !isDone) return false;
        if (fStatus === "pending" && isDone) return false;
      }

      if (fStartDate || fEndDate) {
        const ts = r.timestamp ? new Date(r.timestamp) : null;
        if (!ts) return false;
        const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const tsDay = day(ts);

        if (fStartDate) {
          const start = new Date(fStartDate + "T00:00:00");
          if (tsDay < day(start)) return false;
        }
        if (fEndDate) {
          const end = new Date(fEndDate + "T00:00:00");
          if (tsDay > day(end)) return false;
        }
      }
// Rider ID filter (supports partial match)
if (fRiderId && String(r.rider_id ?? "").indexOf(String(fRiderId).trim()) === -1) return false;
      return true;
    });
  }, [rows, fCity, fField, fOption, fAction, fPriority, fAssignee1, fAssignee2, fStatus, fStartDate, fEndDate, fRiderId]);

  // ---------- SCORECARDS ----------
  const totals = useMemo(() => {
    const total = filteredRows.length;
    const pending = filteredRows.filter(r => r.status !== "done").length;
    const pctPending = total ? Math.round((pending / total) * 100) : 0;
    return { total, pending, pctPending };
  }, [filteredRows]);

  // -------- Confirm / Unconfirm / Assign flows ----------
  const openConfirm = (row) => {
    setConfirmItem(row);
    setNotes("");
    setConfirmOpen(true);
  };

  const doConfirm = async () => {
    try {
      await authAxios.post("/actions/confirm", {
        inspection_id: confirmItem.inspection_id,
        rule_id: confirmItem.rule_id,
        notes: notes || undefined,
      });
      show("success", "Action marked as done.");
      setConfirmOpen(false);
      setConfirmItem(null);
      fetchMatches();
    } catch (e) {
      console.error(e);
      show("error", e?.response?.data?.detail || "Failed to confirm action.");
    }
  };

  const openUnconfirm = (row) => {
    setUnconfirmItem(row);
    setUnconfirmReason("");
    setUnconfirmOpen(true);
  };

  const doUnconfirm = async () => {
    try {
      await authAxios.post("/actions/unconfirm", {
        inspection_id: unconfirmItem.inspection_id,
        rule_id: unconfirmItem.rule_id,
        reason: unconfirmReason || undefined,
      });
      show("success", "Action set back to pending.");
      setUnconfirmOpen(false);
      setUnconfirmItem(null);
      fetchMatches();
    } catch (e) {
  console.error(e);
  const data = e?.response?.data;
  let msg = "Something went wrong.";

  if (Array.isArray(data)) {
    // Handle Pydantic validation errors (the {type, loc, msg, input} case)
    msg = data.map(err => `${err.loc?.join(".")}: ${err.msg}`).join(", ");
  } else if (typeof data === "object" && data?.detail) {
    msg = data.detail;
  } else if (typeof data === "string") {
    msg = data;
  }

  show("error", msg);
}
  };

  const openAssign = (row) => {
    setAssignItem(row);
    const u1 =
      userById.get(row.match_assignee_user_id) ||
      userById.get(row.rule_assignee_user_id) ||
      null;
    const u2 = userById.get(row.match_assignee2_user_id) || null;

    setAssignee1(u1);
    setAssignee2(u2);
    setAssignOpen(true);
  };

  const doAssign = async () => {
    if (!assignItem) return;
    try {
      setAssignSaving(true);
      await authAxios.post("/actions/assign", {
        inspection_id: assignItem.inspection_id,
        rule_id: assignItem.rule_id,
        assignee_user_id: assignee1?.id ?? null,
        assignee2_user_id: assignee2?.id ?? null,
        notes: undefined,
      });
      show("success", "Assignees updated.");
      setAssignOpen(false);
      setAssignItem(null);
      fetchMatches();
    } catch (e) {
      console.error(e);
      show("error", e?.response?.data?.detail || "Failed to set assignees.");
    } finally {
      setAssignSaving(false);
    }
  };

  // -------- Delete flow ----------
  const openDelete = (row) => {
    setDeleteItem(row);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteItem) return;
    const { inspection_id, rule_id } = deleteItem;
    try {
      // Try DELETE with query params first
      try {
        await authAxios.delete("/actions/matches", {
          params: { inspection_id, rule_id },
        });
      } catch (e1) {
        // Try RESTful path
        try {
          await authAxios.delete(`/actions/matches/${inspection_id}/${rule_id}`);
        } catch (e2) {
          // Try POST fallback
          await authAxios.post("/actions/matches/delete", { inspection_id, rule_id });
        }
      }
      show("success", "Record deleted.");
      setDeleteOpen(false);
      setDeleteItem(null);
      fetchMatches();
    } catch (e) {
      console.error(e);
      show("error", e?.response?.data?.detail || "Failed to delete record.");
    }
  };

  // -------- Details (recap) flow ----------
  const openDetails = async (row) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      try {
        const r = await authAxios.get(`/inspections/${row.inspection_id}`);
        setDetailsData(r.data);
      } catch (e1) {
        // Fallback: fetch all and pick the one (not ideal but robust)
        const r = await authAxios.get("/inspections");
        const found = (r.data || []).find(i => i.id === row.inspection_id);
        if (found) setDetailsData(found);
        else throw e1;
      }
    } catch (e) {
      console.error(e);
      setDetailsData({ __error: true });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsData(null);
    setDetailsLoading(false);
  };

  const resetFilters = () => {
    setFCity("");
    setFField("");
    setFOption("");
    setFAction("");
    setFPriority("");
    setFAssignee1(null);
    setFAssignee2(null);
    setFStatus("");
    setFStartDate("");
    setFEndDate("");
    setFRiderId("");  
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f5f7fb", minHeight: "calc(100vh - 64px)" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon color="primary" />
          <Typography variant="h4" fontWeight="bold">Action Center</Typography>
        </Stack>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchMatches}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Stack>

      {/* Scorecards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            }}
            elevation={0}
          >
            <Typography variant="overline" color="text.secondary">Total actions</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <PriorityHighIcon color="primary" />
              <Typography variant="h4" fontWeight={800}>{totals.total}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)",
            }}
            elevation={0}
          >
            <Typography variant="overline" color="text.secondary">Total pending</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <HourglassEmptyIcon color="warning" />
              <Typography variant="h4" fontWeight={800}>{totals.pending}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)",
            }}
            elevation={0}
          >
            <Typography variant="overline" color="text.secondary">% pending</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <DoneAllIcon color="success" />
              <Typography variant="h4" fontWeight={800}>{totals.pctPending}%</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }} elevation={0}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <FilterListIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">Filters</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small"
              label="City"
              value={fCity}
              onChange={(e) => { setFCity(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small"
              label="Field"
              value={fField}
              onChange={(e) => { setFField(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueFields.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small"
              label="Option"
              value={fOption}
              onChange={(e) => { setFOption(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small"
              label="Action"
              value={fAction}
              onChange={(e) => { setFAction(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueActions.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small"
              label="Priority"
              value={fPriority}
              onChange={(e) => { setFPriority(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All</MenuItem>
              {uniquePriorities.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
  <TextField
    size="small"
    label="Rider ID"
    value={fRiderId}
    onChange={(e) => { setFRiderId(e.target.value); setPage(0); }}
    sx={{ minWidth: 220 }}
    placeholder="e.g. 12345"
    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
  />
</Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={users}
              loading={loadingUsers}
              getOptionLabel={(o) => o?.username ?? ""}
              value={fAssignee1}
              onChange={(_, v) => { setFAssignee1(v); setPage(0); }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee 1"
                  size="small"
                  sx={{ minWidth: 220 }}
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
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={users}
              loading={loadingUsers}
              getOptionLabel={(o) => o?.username ?? ""}
              value={fAssignee2}
              onChange={(_, v) => { setFAssignee2(v); setPage(0); }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee 2"
                  size="small"
                  sx={{ minWidth: 220 }}
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
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <TextField
              label="Start date"
              type="date"
              size="small"
              value={fStartDate}
              onChange={(e) => { setFStartDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
              inputProps={{
                onFocus: (e) => e.target.showPicker && e.target.showPicker(),
                onClick: (e) => e.target.showPicker && e.target.showPicker(),
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <TextField
              label="End date"
              type="date"
              size="small"
              value={fEndDate}
              onChange={(e) => { setFEndDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
              inputProps={{
                onFocus: (e) => e.target.showPicker && e.target.showPicker(),
                onClick: (e) => e.target.showPicker && e.target.showPicker(),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small"
              label="Status"
              value={fStatus}
              onChange={(e) => { setFStatus(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
              <Button variant="outlined" onClick={resetFilters} fullWidth startIcon={<UndoIcon />}>
                Reset filters
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper sx={{ p: 2, borderRadius: 3 }} elevation={0}>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560, borderRadius: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Inspection</TableCell>
                <TableCell>Rider</TableCell>{/* NEW */}
                <TableCell>City</TableCell>
                <TableCell>Field</TableCell>
                <TableCell>Option</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assignee 1</TableCell>
                <TableCell>Assignee 2</TableCell>
                <TableCell>Inspected By</TableCell>
                <TableCell>When</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Details</TableCell>{/* NEW */}
                <TableCell align="right">Assign / Confirm / Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(loading ? [] : filteredRows)
                .slice(page * rpp, page * rpp + rpp)
                .map((r) => {
                  const assignee1Name =
                    r.match_assignee_username ||
                    r.rule_assignee_username ||
                    "—";
                  const assignee2Name = r.match_assignee2_username || null;

                  const priority = r.priority ?? "Normal";
                  const borderColor =
                    priority === "Urgent" ? "error.light"
                    : priority === "High" ? "warning.light"
                    : priority === "Normal" ? "info.light"
                    : "divider";

                  return (
                    <TableRow
                      key={`${r.inspection_id}-${r.rule_id}`}
                      hover
                      sx={{
                        "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                        borderLeft: 3,
                        borderLeftColor: borderColor,
                      }}
                    >
                      <TableCell>#{r.inspection_id}</TableCell>
                      <TableCell>{r.rider_id ?? "—"}</TableCell> {/* NEW */}
                      <TableCell>{r.city || "—"}</TableCell>
                      <TableCell>{r.field}</TableCell>
                      <TableCell>{r.option_value}</TableCell>
                      <TableCell>{r.action_name}</TableCell>
                      <TableCell><PriorityChip value={r.priority} /></TableCell>
                      <TableCell><AssigneeChip name={assignee1Name} /></TableCell>
                      <TableCell><AssigneeChip name={assignee2Name} /></TableCell>
                      <TableCell>{r.inspected_by}</TableCell>
                      <TableCell>
                        {r.timestamp ? new Date(r.timestamp).toLocaleString("fr-MA", {
                          timeZone: "Africa/Casablanca",
                          dateStyle: "short",
                          timeStyle: "short",
                        }) : "—"}
                      </TableCell>
                      <TableCell><StatusChip status={r.status} by={r.confirmed_by_username} /></TableCell>
                      <TableCell sx={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => openDetails(r)}
                        >
                          Recap
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Assign owners">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openAssign(r)}
                                disabled={loadingUsers}
                              >
                                <AssignmentIndIcon />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Confirm OR Unconfirm based on status */}
                          {r.status === "done" ? (
                            <Tooltip title="Unconfirm (set back to pending)">
                              <span>
                                <IconButton
                                  color="warning"
                                  onClick={() => openUnconfirm(r)}
                                  size="small"
                                >
                                  <UndoIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Mark done">
                              <span>
                                <IconButton
                                  color="success"
                                  onClick={() => openConfirm(r)}
                                  size="small"
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {/* DELETE ALWAYS VISIBLE */}
                          <Tooltip title="Delete record">
                            <span>
                              <IconButton
                                color="error"
                                onClick={() => openDelete(r)}
                                size="small"
                              >
                                <DeleteForeverIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {(!loading && filteredRows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No matches
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => {
            setRpp(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign owners</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Inspection #{assignItem?.inspection_id} — {assignItem?.action_name}
          </Typography>

          <Stack spacing={2}>
            <Autocomplete
              options={users}
              loading={loadingUsers}
              getOptionLabel={(o) => o?.username ?? ""}
              value={assignee1}
              onChange={(_, v) => setAssignee1(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee 1"
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

            <Autocomplete
              options={users}
              loading={loadingUsers}
              getOptionLabel={(o) => o?.username ?? ""}
              value={assignee2}
              onChange={(_, v) => setAssignee2(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee 2 (optional)"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={doAssign} disabled={assignSaving}>
            {assignSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark action as done</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Inspection #{confirmItem?.inspection_id} — {confirmItem?.action_name}
          </Typography>
          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={doConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Unconfirm dialog */}
      <Dialog open={unconfirmOpen} onClose={() => setUnconfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Unconfirm action</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Inspection #{unconfirmItem?.inspection_id} — {unconfirmItem?.action_name}
          </Typography>
          <TextField
            label="Reason (optional)"
            value={unconfirmReason}
            onChange={(e) => setUnconfirmReason(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Why are you reopening this?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnconfirmOpen(false)}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={doUnconfirm}>
            Unconfirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete record</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This will permanently delete the selected record
            {deleteItem ? ` (inspection #${deleteItem.inspection_id}, rule #${deleteItem.rule_id})` : ""}.
            <br />
            Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Details (recap) dialog */}
      <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="md" fullWidth>
        <DialogTitle>Inspection recap</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : !detailsData || detailsData.__error ? (
            <Typography color="error">Failed to load inspection details.</Typography>
          ) : (
            <Grid container spacing={2}>


             {/* Left: fields as table */}
<Grid item xs={12} md={7}>
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
    <Table size="small">
      <TableBody>
        {[
          ["ID", detailsData.id],
          ["Rider ID", detailsData.rider_id ?? "—"],
          ["ID Number", detailsData.id_number ?? "—"],
          ["Inspected By", detailsData.inspected_by ?? "—"],
          ["City", detailsData.city ?? "—"],
          ["Location", detailsData.location ?? "—"],
          ["Timestamp", detailsData.timestamp ? new Date(detailsData.timestamp).toLocaleString("fr-MA") : "—"],
          ["Helmet", detailsData.helmet ?? "—"],
          ["Box", detailsData.box ?? "—"],
          ["Account", detailsData.account ?? "—"],
          ["Parking", detailsData.parking ?? "—"],
          ["Appearance", detailsData.appearance ?? "—"],
          ["Driving", detailsData.driving ?? "—"],
          ["MFC Status", detailsData.mfc_status ?? "—"],
          ["MFC Location", detailsData.mfc_location ?? "—"],
          ["Courier Behavior", detailsData.courier_behavior ?? "—"],
          ["Plate Number", detailsData.plate_number ?? "—"],
          ["Box Serial", detailsData.box_serial_number ?? "—"],
          ["Comments", detailsData.comments ?? "—"],
        ].map(([k, v]) => (
          <TableRow key={k}>
            <TableCell sx={{ width: 180 }}>
              <Typography variant="caption" color="text.secondary">{k}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{String(v)}</Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Grid>

              {/* Right: image (if any) */}
              <Grid item xs={12} md={5}>
                {detailsData.image_url ? (
                  <Box
                    component="img"
                    src={detailsData.image_url}
                    alt="Inspection"
                    sx={{ width: "100%", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                      borderRadius: 2,
                      border: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Typography color="text.secondary">No image</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={hide}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={alert.severity} onClose={hide} variant="filled" sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}