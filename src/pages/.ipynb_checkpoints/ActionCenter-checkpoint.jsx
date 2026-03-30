
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
import DownloadIcon from "@mui/icons-material/Download";
import authAxios from "../utils/authAxios";
// --- URL helpers: support deployments where authAxios baseURL may include `/api`
const baseRoot = (() => {
  const b = authAxios?.defaults?.baseURL || "";
  // Strip trailing `/api` so we can hit root endpoints like `/actions/...`
  return b.replace(/\/api\/?$/, "");
})();

const absUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  // Always build absolute URL from baseRoot when we have it
  return baseRoot ? `${baseRoot}${path}` : path;
};
function initials(name = "") {
  const parts = String(name).split("@")[0].split(/[.\s_]/).filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || (String(name)[0] || "").toUpperCase();
}
// Backend expects integer user ids for assignment payloads
const userKey = (u) => {
  if (!u) return null;
  return u.id ?? null;
};

// What we display in dropdowns/chips
const userLabel = (u) => {
  if (!u) return "";
  return u.username || u.email || String(u.id ?? "");
};

// -------- Recap helpers (dynamic fields rendering) --------
const prettyLabel = (k) =>
  String(k)
    .replace(/_/g, " ")
    .replace(/\./g, " • ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const flattenObject = (obj, prefix = "") => {
  const out = {};
  if (!isPlainObject(obj)) return out;

  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;

    if (isPlainObject(v)) {
      Object.assign(out, flattenObject(v, key));
    } else if (Array.isArray(v)) {
      out[key] = v.join(", ");
    } else if (v === null || v === undefined) {
      out[key] = "—";
    } else {
      out[key] = v;
    }
  });

  return out;
};
// ---------------------------------------------------------

function PriorityChip({ value }) {
  // Move conditional coloring logic here
  const priorityColor = {
    urgent: '#ffcccc',   // light red
    high: '#fff0b3',     // light yellow
    medium: '#d5f5e3',   // light green
    low: '#d6eaf8'       // light blue
  };
  // Normalize priority to lowercase for lookup
  const label = value ?? "Normal";
  const norm = String(label).toLowerCase();
  const chipStyle = {
    backgroundColor: priorityColor[norm] || '#e0e0e0',
    color: '#000',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  };
  return (
    <Chip
      label={label}
      size="small"
      style={chipStyle}
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

  // bulk assign
const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
const [bulkRule, setBulkRule] = useState(null);
const [bulkCity, setBulkCity] = useState(null);
const [bulkAssignee1, setBulkAssignee1] = useState(null);
const [bulkAssignee2, setBulkAssignee2] = useState(null);
const [bulkSaving, setBulkSaving] = useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // details dialog (recap)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  // -------- FILTERS (client-side) --------
  const [fCity, setFCity] = useState("");
  //const [fField, setFField] = useState("");
  //const [fOption, setFOption] = useState("");
  const [fAction, setFAction] = useState("");
  const [fPriority, setFPriority] = useState(""); // "", "Urgent", "High", "Normal", "Low"
  const [fAssignee1, setFAssignee1] = useState(null); // user obj
  const [fAssignee2, setFAssignee2] = useState(null); // user obj
  const [fStatus, setFStatus] = useState(""); // "", "pending", "done"
  const [fStartDate, setFStartDate] = useState(""); // "YYYY-MM-DD"
  const [fEndDate, setFEndDate] = useState("");
  const [fRiderId, setFRiderId] = useState("");
  const [fRuleId, setFRuleId] = useState("");

  const show = (severity, message) => setAlert({ open: true, severity, message });
  const hide = () => setAlert(a => ({ ...a, open: false }));

  const parseError = (e) => {
  const data = e?.response?.data;
  if (Array.isArray(data)) {
    // Handle Pydantic validation errors (the {type, loc, msg, input} case)
    return data.map(err => `${err.loc?.join(".")}: ${err.msg}`).join(", ");
  } else if (typeof data === "object" && data?.detail) {
    return data.detail;
  } else if (typeof data === "string") {
    return data;
  }
  return "Something went wrong.";
};
const postWithFallback = async (paths, payload) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await authAxios.post(absUrl(p), payload);
    } catch (e) {
      lastErr = e;
      const status = e?.response?.status;
      if (status !== 404) throw e; // only fallback on 404
    }
  }
  throw lastErr;
};

const bulkPostWithFallback = async (paths, payloads) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await authAxios.post(absUrl(p), payloads);
    } catch (e) {
      lastErr = e;
      const status = e?.response?.status;
      if (status !== 404) throw e;
    }
  }
  throw lastErr;
};

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
  // --------- SORTING ----------
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
  };

const sortedRows = useMemo(() => {
  const filtered = rows.filter(r => {
    if (fCity && r.city !== fCity) return false;
    if (fAction && r.action_name !== fAction) return false;
    if (fPriority && (r.priority ?? "Normal") !== fPriority) return false;
    if (fRuleId && String(r.rule_name ?? '').toLowerCase().indexOf(String(fRuleId).trim().toLowerCase()) === -1) return false;
    if (fAssignee1) {
      const a1id = r.match_assignee_user_id ?? r.rule_assignee_user_id ?? null;
      if (String(a1id ?? "") !== String(fAssignee1?.id ?? "")) return false;
    }
    if (fAssignee2) {
      if (String(r.match_assignee2_user_id ?? "") !== String(fAssignee2?.id ?? "")) return false;
    }
    if (fStatus) {
      const isDone = r.status === "done";
      if (fStatus === "done" && !isDone) return false;
      if (fStatus === "pending" && isDone) return false;
    }
    if (fStartDate || fEndDate) {
      const ts = r.timestamp ? new Date(r.timestamp) : null;
      if (!ts) return false;
      const day = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const tsDay = day(ts);
      if (fStartDate) {
        const start = new Date(fStartDate + 'T00:00:00');
        if (tsDay < day(start)) return false;
      }
      if (fEndDate) {
        const end = new Date(fEndDate + 'T00:00:00');
        if (tsDay > day(end)) return false;
      }
    }
    if (fRiderId && String(r.rider_id ?? '').indexOf(String(fRiderId).trim()) === -1) return false;
    return true;
  });

  const sorted = [...filtered];
  if (sortConfig.key) {
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }
  return sorted;
}, [rows, fCity, fAction, fPriority, fAssignee1, fAssignee2, fStatus, fStartDate, fEndDate, fRiderId, fRuleId, sortConfig]);

    
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get(absUrl("/actions/matches"));
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
  users.forEach((u) => {
    if (u?.id != null) m.set(String(u.id), u);
  });
  return m;
}, [users]);

  // ---------- FILTERING ----------
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (fCity && r.city !== fCity) return false;
      if (fAction && r.action_name !== fAction) return false;
      if (fPriority && (r.priority ?? "Normal") !== fPriority) return false;
      if (fRuleId && String(r.rule_name ?? "").toLowerCase().indexOf(String(fRuleId).trim().toLowerCase()) === -1) return false;
      // Assignee 1: match-level assignee1, else fallback to rule default
      if (fAssignee1) {
        const a1id = r.match_assignee_user_id ?? r.rule_assignee_user_id ?? null;
        if (String(a1id ?? "") !== String(fAssignee1?.id ?? "")) return false;
      }
      if (fAssignee2) {
        if (String(r.match_assignee2_user_id ?? "") !== String(fAssignee2?.id ?? "")) return false;
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
  }, [rows, fCity, fAction, fPriority, fAssignee1, fAssignee2, fStatus, fStartDate, fEndDate, fRiderId, fRuleId]);

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
      await postWithFallback(["/actions/confirm"], {
        inspection_id: confirmItem.inspection_id,
        rule_id: Number(confirmItem.rule_id),
        notes: notes || undefined,
      });
      show("success", "Action marked as done.");
      setConfirmOpen(false);
      setConfirmItem(null);
      fetchMatches();
    } catch (e) {
      console.error(e);
      show("error", parseError(e));
    }
  };

  const openUnconfirm = (row) => {
    setUnconfirmItem(row);
    setUnconfirmReason("");
    setUnconfirmOpen(true);
  };

  const doUnconfirm = async () => {
    try {
      await postWithFallback(["/actions/unconfirm"], {
        inspection_id: unconfirmItem.inspection_id,
        rule_id: Number(unconfirmItem.rule_id),
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
  userById.get(String(row.match_assignee_user_id ?? "")) ||
  userById.get(String(row.rule_assignee_user_id ?? "")) ||
  null;

const u2 = userById.get(String(row.match_assignee2_user_id ?? "")) || null;

    setAssignee1(u1);
    setAssignee2(u2);
    setAssignOpen(true);
  };

const doAssign = async () => {
  if (!assignItem) return;
  try {
    setAssignSaving(true);

    // Prevent duplicate assignment: check if this (inspection_id, rule_id) exists in rows
    const alreadyAssigned = rows.some(
      (r) =>
        String(r.inspection_id) === String(assignItem.inspection_id) &&
        String(r.rule_id) === String(assignItem.rule_id)
    );
    // If already assigned and assignees match, don't send request
    if (
      alreadyAssigned &&
      (String(assignItem.match_assignee_user_id ?? "") === String(assignee1?.id ?? "")) &&
      (String(assignItem.match_assignee2_user_id ?? "") === String(assignee2?.id ?? ""))
    ) {
      show("info", "Already assigned to selected user(s).");
      setAssignOpen(false);
      setAssignItem(null);
      return;
    }

    const payload = {
      inspection_id: assignItem.inspection_id,
      rule_id: Number(assignItem.rule_id),
      assignee_user_id: assignee1?.id ?? null,
      assignee2_user_id: assignee2?.id ?? null,
      notes: undefined,
    };

    console.log("Assign payload:", payload); // ✅ debugging helper
    await postWithFallback(["/actions/assign"], payload);

    show("success", "Assignees updated.");
    setAssignOpen(false);
    setAssignItem(null);
    fetchMatches();
  } catch (e) {
    console.error(e);
    show("error", parseError(e));
  } finally {
    setAssignSaving(false);
  }
};

const doBulkAssign = async () => {
  if (!bulkRule?.id || !bulkCity) {
    show("error", "Please select both a rule and a city before assigning.");
    return;
  }

  try {
    setBulkSaving(true);

    const ruleId = Number(bulkRule.id);

    // update existing matches in Action Center (rows)
    const matchesInScope = rows.filter(
      (r) => String(r.city) === String(bulkCity) && Number(r.rule_id) === ruleId
    );

    const inspectionIds = Array.from(
      new Set(matchesInScope.map((r) => r.inspection_id).filter(Boolean))
    );

    if (inspectionIds.length === 0) {
      show("info", "No actions found for the selected city + rule.");
      return;
    }

    // Backend expects body as ARRAY, and each item uses `inspection_id` as a LIST (e.g. [5])
    const payloads = [
      {
        inspection_id: inspectionIds, // list of ids
        rule_id: ruleId,
        assignee_user_id: bulkAssignee1?.id ?? null,
        assignee2_user_id: bulkAssignee2?.id ?? null,
        notes: null,
      },
    ];

    console.log("Bulk Assign Payloads:", payloads);

    await bulkPostWithFallback(["/actions/assign/bulk"], payloads);

    show("success", `Bulk assignment updated for ${inspectionIds.length} action(s).`);
    setBulkAssignOpen(false);
    setBulkRule(null);
    setBulkCity(null);
    setBulkAssignee1(null);
    setBulkAssignee2(null);
    fetchMatches();
  } catch (e) {
    console.error("Bulk assign failed:", e);
    show("error", parseError(e));
  } finally {
    setBulkSaving(false);
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
    // Only try to delete if the match actually exists
    const exists = rows.some(
      (r) =>
        String(r.inspection_id) === String(inspection_id) &&
        String(r.rule_id) === String(rule_id)
    );
    if (!exists) {
      show("info", "This action is already deleted.");
      setDeleteOpen(false);
      setDeleteItem(null);
      return;
    }
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
    setFAction("");
    setFPriority("");
    setFAssignee1(null);
    setFAssignee2(null);
    setFStatus("");
    setFStartDate("");
    setFEndDate("");
    setFRiderId("");
    setFRuleId("");
    setPage(0);
  };

  // -------- CSV Export (exports sortedRows: filtered + sorted) --------
  const csvEscape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // Escape quotes and wrap in quotes if needed
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const downloadCsv = () => {
    try {
      const data = (sortedRows || []);
      if (!data.length) {
        show("info", "No rows to export.");
        return;
      }

      // Column order for export
      const cols = [
        { key: "inspection_id", label: "inspection_id" },
        { key: "rider_id", label: "rider_id" },
        { key: "city", label: "city" },
        { key: "rule_name", label: "rule_name" },
        { key: "action_name", label: "action_name" },
        { key: "priority", label: "priority" },
        { key: "match_assignee_username", label: "assignee_1" },
        { key: "match_assignee2_username", label: "assignee_2" },
        { key: "inspected_by", label: "inspected_by" },
        { key: "timestamp", label: "timestamp" },
        { key: "status", label: "status" },
        { key: "notes", label: "notes" },
      ];

      const header = cols.map((c) => csvEscape(c.label)).join(",");
      const lines = data.map((r) => {
        const row = cols.map((c) => {
          let val = r?.[c.key];

          // Keep Morocco-local human time as extra-friendly value
          if (c.key === "timestamp" && val) {
            try {
              val = new Date(val).toLocaleString("fr-MA", {
                timeZone: "Africa/Casablanca",
                dateStyle: "short",
                timeStyle: "short",
              });
            } catch (e) {
              // fallback to raw
            }
          }

          // Priority default
          if (c.key === "priority") val = val ?? "Normal";

          // Assignee 1 fallback (match assignee or rule default)
          if (c.key === "match_assignee_username") {
            val = r?.match_assignee_username || r?.rule_assignee_username || "";
          }

          return csvEscape(val);
        });
        return row.join(",");
      });

      const csv = [header, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const filename = `action_center_${y}-${m}-${d}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      show("success", `CSV downloaded (${data.length} rows).`);
    } catch (e) {
      console.error(e);
      show("error", "Failed to export CSV.");
    }
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

          <Tooltip title="Download CSV">
            <IconButton color="primary" onClick={downloadCsv}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Bulk Assign">
            <IconButton color="primary" onClick={() => setBulkAssignOpen(true)}>
              <AssignmentIndIcon />
            </IconButton>
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
              background: "linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)",
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
  <TextField
    size="small"
    label="Rule Name"
    value={fRuleId}
    onChange={(e) => { setFRuleId(e.target.value); setPage(0); }}
    sx={{ minWidth: 220 }}
    placeholder="e.g. 123"
    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
  />
</Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={users}
              loading={loadingUsers}
              getOptionLabel={(o) => userLabel(o)}
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
              getOptionLabel={(o) => userLabel(o)}
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
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort("inspection_id")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "inspection_id" ? sortConfig.direction : false}>
                  Inspection {sortConfig.key === "inspection_id" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("rider_id")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "rider_id" ? sortConfig.direction : false}>
                  Rider {sortConfig.key === "rider_id" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("city")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "city" ? sortConfig.direction : false}>
                  City {sortConfig.key === "city" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("rule_name")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "rule_name" ? sortConfig.direction : false}>
                  Rule Name {sortConfig.key === "rule_name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("action_name")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "action_name" ? sortConfig.direction : false}>
                  Action {sortConfig.key === "action_name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("priority")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "priority" ? sortConfig.direction : false}>
                  Priority {sortConfig.key === "priority" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("match_assignee_username")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "match_assignee_username" ? sortConfig.direction : false}>
                  Assignee 1 {sortConfig.key === "match_assignee_username" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("match_assignee2_username")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "match_assignee2_username" ? sortConfig.direction : false}>
                  Assignee 2 {sortConfig.key === "match_assignee2_username" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("inspected_by")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "inspected_by" ? sortConfig.direction : false}>
                  Inspected By {sortConfig.key === "inspected_by" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("timestamp")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "timestamp" ? sortConfig.direction : false}>
                  When {sortConfig.key === "timestamp" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("status")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "status" ? sortConfig.direction : false}>
                  Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell onClick={() => handleSort("notes")} sx={{ cursor: "pointer" }} sortDirection={sortConfig.key === "notes" ? sortConfig.direction : false}>
                  Comment {sortConfig.key === "notes" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </TableCell>
                <TableCell>
                  Details
                </TableCell>
                <TableCell align="right">
                  Assign / Confirm / Delete
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Highlight logic for highest/lowest Rider ID and Inspection ID */}
              {(() => {
                // Compute max/min for rider_id and inspection_id among current sortedRows
                const visibleRows = (loading ? [] : sortedRows).slice(page * rpp, page * rpp + rpp);
                // Only numeric rider_id and inspection_id considered
                const riderIds = visibleRows.map(r => Number(r.rider_id)).filter(v => !isNaN(v));
                const inspectionIds = visibleRows.map(r => Number(r.inspection_id)).filter(v => !isNaN(v));
                const maxRiderId = riderIds.length > 0 ? Math.max(...riderIds) : null;
                const minRiderId = riderIds.length > 0 ? Math.min(...riderIds) : null;
                const maxInspectionId = inspectionIds.length > 0 ? Math.max(...inspectionIds) : null;
                const minInspectionId = inspectionIds.length > 0 ? Math.min(...inspectionIds) : null;
                return visibleRows.map((r) => {
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
                  // Highlight classes
                  let riderIdClass = "";
                  let inspectionIdClass = "";
                  if (r.rider_id && !isNaN(Number(r.rider_id))) {
                    if (Number(r.rider_id) === maxRiderId) riderIdClass = "high-value";
                    else if (Number(r.rider_id) === minRiderId) riderIdClass = "low-value";
                  }
                  if (r.inspection_id && !isNaN(Number(r.inspection_id))) {
                    if (Number(r.inspection_id) === maxInspectionId) inspectionIdClass = "high-value";
                    else if (Number(r.inspection_id) === minInspectionId) inspectionIdClass = "low-value";
                  }
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
                      <TableCell className={inspectionIdClass}>#{r.inspection_id}</TableCell>
                      <TableCell className={riderIdClass}>
                        {r.rider_id ? (
                          <a
                            href={`https://gv-ma.me.logisticsbackoffice.com/dashboard/rooster/workers?filter_status=active_contract&page=1&size=10&search_id=${r.rider_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1976d2", textDecoration: "none", fontWeight: 600 }}
                          >
                            {r.rider_id}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{r.city || "—"}</TableCell>
                      <TableCell>{r.rule_name || "—"}</TableCell>
                      <TableCell>{r.action_name}</TableCell>
                      <TableCell>
                        <PriorityChip value={r.priority} />
                      </TableCell>
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
                });
              })()}
              {(!loading && sortedRows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No matches
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sortedRows.length}
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
              getOptionLabel={(o) => userLabel(o)}
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
              getOptionLabel={(o) => userLabel(o)}
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

      {/* Bulk Assign dialog */}
<Dialog open={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Bulk Assign</DialogTitle>
  <DialogContent dividers>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Assign multiple actions at once based on Rule and City.
    </Typography>

    <Stack spacing={2}>
  <Autocomplete
  options={Array.from(
    new Map(rows.map(r => [String(r.rule_id), r.rule_name])).entries()
  ).map(([id, name]) => ({ id, name }))}
  getOptionLabel={(o) => o?.name ?? ""}
  value={bulkRule}
  onChange={(_, v) => setBulkRule(v)}
  renderInput={(params) => (
    <TextField {...params} label="Rule Name" size="small" />
  )}
/>

      <Autocomplete
        options={uniqueCities}
        getOptionLabel={(o) => o}
        value={bulkCity}
        onChange={(_, v) => setBulkCity(v)}
        renderInput={(params) => (
          <TextField {...params} label="City" size="small" />
        )}
      />

      <Autocomplete
        options={users}
        loading={loadingUsers}
        getOptionLabel={(o) => userLabel(o)}
        value={bulkAssignee1}
        onChange={(_, v) => setBulkAssignee1(v)}
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
        getOptionLabel={(o) => userLabel(o)}
        value={bulkAssignee2}
        onChange={(_, v) => setBulkAssignee2(v)}
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
    <Button onClick={() => setBulkAssignOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={doBulkAssign} disabled={bulkSaving}>
      {bulkSaving ? "Saving..." : "Save"}
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
        {(() => {
          // Backend may return either:
          // 1) { id, inspected_by, form_name, fields: {...} }
          // 2) or the fields directly
          const fieldsObj = detailsData?.fields && isPlainObject(detailsData.fields)
            ? detailsData.fields
            : (isPlainObject(detailsData) ? detailsData : {});

          // Flatten root fields
          const flat = flattenObject(fieldsObj);

          // Flatten custom_fields (so they appear as rows like custom_fields.status)
          const cf = isPlainObject(fieldsObj?.custom_fields)
            ? flattenObject(fieldsObj.custom_fields, "custom_fields")
            : {};

          const merged = { ...flat, ...cf };

          // Add meta fields (if present)
          if (detailsData?.id != null) merged["id"] = detailsData.id;
          if (detailsData?.inspected_by) merged["inspected_by"] = detailsData.inspected_by;
          if (detailsData?.form_name) merged["form_name"] = detailsData.form_name;

          // Avoid showing the raw custom_fields object row
          delete merged["custom_fields"];

          const entries = Object.entries(merged);

          if (entries.length === 0) {
            return (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography color="text.secondary">No fields found.</Typography>
                </TableCell>
              </TableRow>
            );
          }

          return entries.map(([k, v]) => (
            <TableRow key={k}>
              <TableCell sx={{ width: 220 }}>
                <Typography variant="caption" color="text.secondary">
                  {prettyLabel(k)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {typeof v === "string" ? v : JSON.stringify(v)}
                </Typography>
              </TableCell>
            </TableRow>
          ));
        })()}
      </TableBody>
    </Table>
  </TableContainer>
</Grid>

              {/* Right: image (if any) */}
              <Grid item xs={12} md={5}>
                {(() => {
                  const fieldsObj = detailsData?.fields && isPlainObject(detailsData.fields)
                    ? detailsData.fields
                    : detailsData;

                  const img = fieldsObj?.image_url || detailsData?.image_url;

                  return img ? (
                    <Box
                      component="img"
                      src={img}
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
                  );
                })()}
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
  {typeof alert.message === "object"
    ? JSON.stringify(alert.message)
    : alert.message}
</Alert>
      </Snackbar>
    </Box>
  );
}