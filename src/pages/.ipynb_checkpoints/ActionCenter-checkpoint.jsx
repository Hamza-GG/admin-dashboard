import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Stack, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete, CircularProgress
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import authAxios from "../utils/authAxios";

export default function ActionCenter() {
  const [rows, setRows] = useState([]); // matches
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]); // [{id, username, role, ...}]
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [city, setCity] = useState(""); // optional filter
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  const [alert, setAlert] = useState({ open: false, severity: "success", message: "" });

  // confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [notes, setNotes] = useState("");

  // assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignItem, setAssignItem] = useState(null);
  const [assignee1, setAssignee1] = useState(null); // user obj or null
  const [assignee2, setAssignee2] = useState(null); // user obj or null
  const [assignSaving, setAssignSaving] = useState(false);

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
      if (city) params.city = city;
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
  }, [city]);

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(rows.map(r => r.city).filter(Boolean))).sort();
  }, [rows]);

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach(u => m.set(u.id, u));
    return m;
  }, [users]);

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

  // -------- Assign flow -----------
  const openAssign = (row) => {
    setAssignItem(row);

    // Pre-fill with match-level assignees if exist; otherwise use rule default as assignee1 suggestion
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
        notes: undefined, // optional; leave for confirm step
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
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Inspections that match your rules. Assign owners and mark actions as completed once handled.
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            size="small"
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {uniqueCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={fetchMatches}>Apply</Button>
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Inspection</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Field</TableCell>
                <TableCell>Option</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Inspected By</TableCell>
                <TableCell>When</TableCell>
                <TableCell>Rule Assignee</TableCell>
                <TableCell>Match Assignees</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Assign / Confirm</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(loading ? [] : rows)
                .slice(page * rpp, page * rpp + rpp)
                .map((r) => (
                  <TableRow key={`${r.inspection_id}-${r.rule_id}`} hover>
                    <TableCell>#{r.inspection_id}</TableCell>
                    <TableCell>{r.city || "—"}</TableCell>
                    <TableCell>{r.field}</TableCell>
                    <TableCell>{r.option_value}</TableCell>
                    <TableCell>{r.action_name}</TableCell>
                    <TableCell>{r.inspected_by}</TableCell>
                    <TableCell>
                      {r.timestamp ? new Date(r.timestamp).toLocaleString("fr-MA", {
                        timeZone: "Africa/Casablanca",
                        dateStyle: "short",
                        timeStyle: "short",
                      }) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.rule_assignee_username || "—"}
                    </TableCell>
                    <TableCell>
                      {[
                        r.match_assignee_username || null,
                        r.match_assignee2_username || null,
                      ].filter(Boolean).join(" , ") || "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "done"
                        ? `done by ${r.confirmed_by_username || "—"}`
                        : "pending"}
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
                        <Tooltip title={r.status === "done" ? "Already done" : "Mark done"}>
                          <span>
                            <IconButton
                              color="success"
                              onClick={() => openConfirm(r)}
                              disabled={r.status === "done"}
                              size="small"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              {(!loading && rows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No matches
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={rows.length}
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