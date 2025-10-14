import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Stack, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete, CircularProgress,
  Grid
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UndoIcon from "@mui/icons-material/Undo";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import authAxios from "../utils/authAxios";

export default function ActionCenter() {
  const [rows, setRows] = useState([]); // matches (fetched)
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]); // [{id, username, role, ...}]
  const [loadingUsers, setLoadingUsers] = useState(true);

  // server-side param we already support
  const [cityFetch, setCityFetch] = useState("");

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

  // -------- FILTERS (client-side) --------
  const [fCity, setFCity] = useState("");
  const [fField, setFField] = useState("");
  const [fOption, setFOption] = useState("");
  const [fAction, setFAction] = useState("");
  const [fAssignee1, setFAssignee1] = useState(null); // user obj
  const [fAssignee2, setFAssignee2] = useState(null); // user obj
  const [fStatus, setFStatus] = useState(""); // "", "pending", "done"
  const [fStartDate, setFStartDate] = useState(""); // "YYYY-MM-DD"
  const [fEndDate, setFEndDate] = useState("");

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
      const params = {};
      if (cityFetch) params.city = cityFetch;
      const res = await authAxios.get("/actions/matches", { params });
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
  }, [cityFetch]);

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
        const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
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

      return true;
    });
  }, [rows, fCity, fField, fOption, fAction, fAssignee1, fAssignee2, fStatus, fStartDate, fEndDate]);

  // ---------- SCORECARDS ----------
  const totals = useMemo(() => {
    const total = filteredRows.length;
    const pending = filteredRows.filter(r => r.status !== "done").length;
    const pctPending = total ? Math.round((pending / total) * 100) : 0;
    return { total, pending, pctPending };
  }, [filteredRows]);

  // -------- Confirm flow ----------
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

  // -------- Unconfirm flow ----------
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
      show("error", e?.response?.data?.detail || "Failed to unconfirm action.");
    }
  };

  // -------- Assign flow -----------
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
        notes: undefined, // keep confirm step for final notes
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

  const resetFilters = () => {
    setFCity("");
    setFField("");
    setFOption("");
    setFAction("");
    setFAssignee1(null);
    setFAssignee2(null);
    setFStatus("");
    setFStartDate("");
    setFEndDate("");
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f7fafd", minHeight: "calc(100vh - 64px)" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Action Center</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchMatches}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Stack>

      {/* Scorecards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Total actions</Typography>
            <Typography variant="h4" fontWeight={800}>{totals.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Total pending</Typography>
            <Typography variant="h4" fontWeight={800}>{totals.pending}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">% pending</Typography>
            <Typography variant="h4" fontWeight={800}>{totals.pctPending}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Fetch control (server-side City param) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
          <TextField
            select
            size="small"
            label="Fetch by City (server)"
            value={cityFetch}
            onChange={(e) => setCityFetch(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All</MenuItem>
            {uniqueCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={fetchMatches}>Refetch</Button>
        </Stack>
      </Paper>

      {/* Filters (client-side) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small" fullWidth
              label="City"
              value={fCity}
              onChange={(e) => { setFCity(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small" fullWidth
              label="Field"
              value={fField}
              onChange={(e) => { setFField(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueFields.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small" fullWidth
              label="Option"
              value={fOption}
              onChange={(e) => { setFOption(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small" fullWidth
              label="Action"
              value={fAction}
              onChange={(e) => { setFAction(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueActions.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
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
                  fullWidth
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
                  fullWidth
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
              fullWidth
              value={fStartDate}
              onChange={(e) => { setFStartDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <TextField
              label="End date"
              type="date"
              size="small"
              fullWidth
              value={fEndDate}
              onChange={(e) => { setFEndDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select size="small" fullWidth
              label="Status"
              value={fStatus}
              onChange={(e) => { setFStatus(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
              <Button variant="outlined" onClick={resetFilters} fullWidth>Reset filters</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Inspection</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Field</TableCell>
                <TableCell>Option</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Assignee 1</TableCell>
                <TableCell>Assignee 2</TableCell>
                <TableCell>Inspected By</TableCell>
                <TableCell>When</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell align="right">Assign / Confirm</TableCell>
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
                  const assignee2Name = r.match_assignee2_username || "—";
                  return (
                    <TableRow key={`${r.inspection_id}-${r.rule_id}`} hover>
                      <TableCell>#{r.inspection_id}</TableCell>
                      <TableCell>{r.city || "—"}</TableCell>
                      <TableCell>{r.field}</TableCell>
                      <TableCell>{r.option_value}</TableCell>
                      <TableCell>{r.action_name}</TableCell>
                      <TableCell>{assignee1Name}</TableCell>
                      <TableCell>{assignee2Name}</TableCell>
                      <TableCell>{r.inspected_by}</TableCell>
                      <TableCell>
                        {r.timestamp ? new Date(r.timestamp).toLocaleString("fr-MA", {
                          timeZone: "Africa/Casablanca",
                          dateStyle: "short",
                          timeStyle: "short",
                        }) : "—"}
                      </TableCell>
                      <TableCell>
                        {r.status === "done"
                          ? `done by ${r.confirmed_by_username || "—"}`
                          : "pending"}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.notes || "—"}
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
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {(!loading && filteredRows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No matches
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6, color: "text.secondary" }}>
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