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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RuleIcon from "@mui/icons-material/Rule";
import BoltIcon from "@mui/icons-material/Bolt";
import DescriptionIcon from "@mui/icons-material/Description";
import authAxios from "../utils/authAxios";

const CITY_OPTIONS = [
  "Agadir","Ben guerir","Beni mellal","Berrechid","Bouskoura","Bouznika","Casablanca","Dakhla",
  "Dar bouazza","El jadida","Essaouira","Fes","Ifrane","Kenitra","Khemisset","Khouribga",
  "Laayoune","Larache","M'diq","Marrakech","Meknes","Mohammedia","Nador","Nouacer","Ouarzazate",
  "Oujda","Rabat","Safi","Settat","Tamesna","Tanger","Technopolis","Tetouan"];

// Keep these values exactly as backend expects
const PRIORITY_OPTIONS = ["Urgent", "High", "Medium", "Low", "Info", "None"];

function priorityColor(priority) {
  const p = (priority || "").toString().trim().toLowerCase();
  switch (p) {
    case "urgent":
      return "error";      // red
    case "high":
      return "warning";    // orange
    case "medium":
      return "info";       // blue
    case "low":
      return "success";    // green
    case "info":
      return "secondary";  // gray
    case "none":
    default:
      return "default";    // outlined
  }
}

/** Full-bleed wrapper that escapes any parent Container limits */
function FullBleed({ children }) {
  return (
    <Box
      sx={{
        width: "100vw",
        ml: "calc(50% - 50vw)", // pull to left edge
        mr: "calc(50% - 50vw)", // pull to right edge
      }}
    >
      {children}
    </Box>
  );
}

function normStr(v) {
  return (v ?? "").toString().trim().toLowerCase();
}

function arrToStr(v) {
  if (Array.isArray(v)) return v.join(",");
  return (v ?? "").toString();
}

function slugifyFieldId(label) {
  const s = (label ?? "").toString().trim().toLowerCase();
  // keep letters/numbers/underscore, convert spaces and dashes to underscore
  const slug = s
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "field";
}

function normalizeFieldBuilderItem(raw, idx) {
  const base = raw && typeof raw === "object" ? raw : {};

  const label = String(base.label ?? base.name ?? base.id ?? base.key ?? `Field ${idx + 1}`);
  const type = String(base.type ?? "text");
  const required = Boolean(base.required ?? false);
  const multi = Boolean(base.multi ?? false);

  const optionsArr = Array.isArray(base.options)
    ? base.options
    : typeof base.options === "string"
    ? base.options
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const options_text =
    typeof base.options_text === "string"
      ? base.options_text
      : Array.isArray(optionsArr)
      ? optionsArr.join("\n")
      : "";

  // We make id/key derived from label (user-friendly) unless backend already provided one
  const idFromBackend = base.id ?? base.key;
  const id = String(idFromBackend ?? slugifyFieldId(label));

  return {
    id,
    key: base.key ?? id,
    label,
    type,
    required,
    multi,
    options: optionsArr,
    options_text,
  };
}

function builderToPayloadFields(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((f, idx) => {
      const item = normalizeFieldBuilderItem(f, idx);
      const safeLabel = String(item.label ?? item.id);
      const safeId = String(slugifyFieldId(safeLabel));
      return {
        id: safeId,
        key: safeId,
        label: String(item.label ?? safeId),
        type: String(item.type ?? "text"),
        required: Boolean(item.required ?? false),
        options:
          String(item.type).toLowerCase() === "select"
            ? (Array.isArray(item.options) ? item.options : [])
            : null,
        multi: String(item.type).toLowerCase() === "select" ? Boolean(item.multi ?? false) : false,
      };
    })
    .filter((f) => f.id && f.label && f.type);
}

function getFormFields(form) {
  const raw = form?.fields ?? form?.schema ?? form?.definition ?? null;
  const fields = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.fields)
    ? raw.fields
    : [];

  return fields
    .map((f) => {
      if (!f || typeof f !== "object") return null;
      const key = (f.key ?? f.id ?? "").toString().trim();
      if (!key) return null;

      return {
        key,
        label: (f.label ?? key).toString(),
        type: (f.type ?? "text").toString(),
        options: Array.isArray(f.options) ? f.options : [],
      };
    })
    .filter(Boolean);
}
function formatAssignedUsers(form, users) {
  const ulist = Array.isArray(users) ? users : [];

  const raw =
    form?.assigned_usernames ??
    form?.assignee_usernames ??
    form?.supervisor_usernames ??
    form?.assigned_to ??
    form?.assigned_users ??
    form?.assignees ??
    form?.assigned_user_ids ??
    form?.assignee_user_ids ??
    form?.supervisor_ids ??
    [];

  // array of objects -> [{username/email/...}]
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object" && raw[0] !== null) {
    const names = raw
      .map((x) => (x?.username ?? x?.email ?? x?.name ?? "").toString().trim())
      .filter(Boolean);
    return names.length ? names.join(", ") : "—";
  }

  // string -> "a@b.com, c@d.com"
  if (typeof raw === "string") {
    const s = raw.trim();
    return s ? s : "—";
  }

  // array of strings -> ["a@b.com", ...]
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "string") {
    const names = raw.map((x) => x.trim()).filter(Boolean);
    return names.length ? names.join(", ") : "—";
  }

  // array of ids -> [1,2]
  if (Array.isArray(raw) && raw.length) {
    const ids = raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    const names = ids
      .map((id) => ulist.find((u) => Number(u?.id) === id)?.username)
      .filter(Boolean);

    return names.length ? names.join(", ") : "—";
  }

  return "—";
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
            <ListItemButton selected={activeTab === "forms"} onClick={() => onChange("forms")}>
        <DescriptionIcon sx={{ mr: 1 }} />
        <ListItemText primary="Forms" />
      </ListItemButton>
    </List>
  );
}

export default function Settings() {
    const [activeTab, setActiveTab] = useState("actions"); // "actions" | "rules" | "users" | "forms"

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
  city: [],
  form_name: [],
  field: "",
  option_value: [],
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
  const [filterFormName, setFilterFormName] = useState("");
  const [filterOptionValue, setFilterOptionValue] = useState("");
  const [pageRules, setPageRules] = useState(0);
  const [rppRules, setRppRules] = useState(10);
    const filteredRules = useMemo(() => {
    const rid = normStr(filterRuleId);
    const fld = normStr(filterField);
    const frm = normStr(filterFormName);
    const opt = normStr(filterOptionValue);

    return (rules || []).filter((r) => {
      const rRuleId = normStr(r?.rule_id);
      const rField = normStr(r?.field);
      const rForm = normStr(arrToStr(r?.form_name));
      const rOpt = normStr(arrToStr(r?.option_value));

      const okRuleId = !rid || rRuleId.includes(rid);
      const okField = !fld || rField.includes(fld);

      const formsArr = rForm.split(",").map((x) => x.trim()).filter(Boolean);
      const okForm = !frm || formsArr.includes(frm);

      const okOpt = !opt || rOpt.includes(opt);

      return okRuleId && okField && okForm && okOpt;
    });
  }, [rules, filterRuleId, filterField, filterFormName, filterOptionValue]);

  // -------- Users tab state ----
  const [userPage, setUserPage] = useState(0);
  const [userRpp, setUserRpp] = useState(10);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserRow, setEditUserRow] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // -------- Rule Edit/Delete dialogs ----
  // -------- Forms (dynamic inspections forms) -----
  const [forms, setForms] = useState([]);
  const [formAssignmentsById, setFormAssignmentsById] = useState({}); // { [formId]: string[] }
  const [loadingFormAssignments, setLoadingFormAssignments] = useState(false);
  const formNameOptions = useMemo(
  () => Array.from(new Set((forms || []).map((f) => f?.name).filter(Boolean))).sort(),
  [forms]
    );

  // ===== Derived form-field dropdowns for Rules =====
  const formFieldsByName = useMemo(() => {
    const m = new Map();
    (forms || []).forEach((f) => {
      const name = (f?.name ?? "").toString();
      if (!name) return;
      m.set(name, getFormFields(f));
    });
    return m;
  }, [forms]);

  // CREATE RULE dropdowns
  const createSelectedFormNames = useMemo(
    () => (Array.isArray(createForm.form_name) ? createForm.form_name : []),
    [createForm.form_name]
  );

  const createFieldOptions = useMemo(() => {
    if (!createSelectedFormNames.length) return [];

    const merged = new Map();
    createSelectedFormNames.forEach((name) => {
      (formFieldsByName.get(name) || []).forEach((d) => {
        if (!merged.has(d.key)) merged.set(d.key, d);
      });
    });

    return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [createSelectedFormNames, formFieldsByName]);

  const createSelectedFieldDef = useMemo(() => {
    const key = (createForm.field || "").toString().trim();
    if (!key) return null;
    return createFieldOptions.find((d) => d.key === key) || null;
  }, [createForm.field, createFieldOptions]);

  const createOptionDropdown = useMemo(() => {
    const opts = createSelectedFieldDef?.options || [];
    return Array.isArray(opts) ? opts : [];
  }, [createSelectedFieldDef]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [formPage, setFormPage] = useState(0);
  const [formRpp, setFormRpp] = useState(10);
  const [formSearch, setFormSearch] = useState("");

  // Create/Edit form dialog
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editFormRow, setEditFormRow] = useState(null);
  const [formFieldsList, setFormFieldsList] = useState([]); // [{id,label,type,required,options}]
  const [formFieldsJson, setFormFieldsJson] = useState("[]"); // legacy debug view; builder is source of truth
  const [formAssignees, setFormAssignees] = useState([]); // array of user objects
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editAssignee, setEditAssignee] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // -------- Snackbars --------------
  const [alert, setAlert] = useState({ open: false, severity: "success", message: "" });
  const showAlert = (severity, message) => {
    const safeMessage =
      typeof message === "string"
        ? message
        : message == null
        ? ""
        : Array.isArray(message)
        ? message.map((m) => (typeof m === "string" ? m : JSON.stringify(m))).join("; ")
        : JSON.stringify(message);

    setAlert({ open: true, severity, message: safeMessage });
  };
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

  
  const fetchFormAssignments = async (formsList) => {
    const list = Array.isArray(formsList) ? formsList : [];
    if (!list.length) {
      setFormAssignmentsById({});
      return;
    }

    setLoadingFormAssignments(true);
    try {
      const results = await Promise.all(
        list
          .filter((f) => f?.id != null)
          .map(async (f) => {
            try {
              const res = await authAxios.get(`/forms/${f.id}/assignments`);
              // Expect: { supervisors: ["email"...] } OR ["email"...] OR { assigned_usernames: [...] }
              const data = res.data;
              let arr = [];

              // Common shapes:
              // 1) [{ supervisor_username: "a@b.com", ... }, ...]
              // 2) ["a@b.com", "b@c.com"]
              // 3) { supervisors: ["a@b.com"] } or { assigned_usernames: [...] } or { assignees: [...] }
              if (Array.isArray(data)) {
                arr = data;
              } else if (Array.isArray(data?.supervisors)) {
                arr = data.supervisors;
              } else if (Array.isArray(data?.assigned_usernames)) {
                arr = data.assigned_usernames;
              } else if (Array.isArray(data?.assignees)) {
                arr = data.assignees;
              } else if (Array.isArray(data?.assignments)) {
                arr = data.assignments;
              }

              arr = (arr || [])
                .map((x) => {
                  if (x && typeof x === "object") {
                    // Backend assignment row shape
                    return String(
                      x?.supervisor_username ??
                        x?.username ??
                        x?.email ??
                        x?.name ??
                        ""
                    ).trim();
                  }
                  return String(x ?? "").trim();
                })
                .filter(Boolean);

              return [String(f.id), arr];
            } catch (e) {
              // If endpoint missing or fails, keep empty list for this form
              return [String(f.id), []];
            }
          })
      );

      const map = {};
      results.forEach(([id, arr]) => {
        map[id] = arr;
      });
      setFormAssignmentsById(map);
    } finally {
      setLoadingFormAssignments(false);
    }
  };

  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      const res = await authAxios.get("/forms");
      const list = res.data || [];
      setForms(list);
      // Load assignments for proper display in the Forms table
      await fetchFormAssignments(list);
    } catch (e) {
      console.error(e);
      showAlert("error", "Failed to load forms.");
    } finally {
      setLoadingForms(false);
    }
  };

  const openCreateForm = () => {
    setEditFormRow({ name: "", type: "Rider", is_active: true });

    // Start with one empty field for convenience
    const initial = [
      { id: "comment", key: "comment", label: "Comment", type: "text", required: false, multi: false, options: [] },
    ];
    setFormFieldsList(initial);
    setFormFieldsJson(JSON.stringify(initial, null, 2));

    setFormAssignees([]);
    setEditFormOpen(true);
  };

  const openEditForm = (f) => {
    setEditFormRow({ ...f });
    setEditFormRow((prev) => ({ ...prev, type: prev?.type || "Rider" }));

    // backend may return fields as array/object. Keep it editable as JSON.
    const raw = f?.fields ?? f?.schema ?? f?.definition ?? [];
    const fields = Array.isArray(raw) ? raw : Array.isArray(raw?.fields) ? raw.fields : [];

    // ✅ builder list
    const normalized = (fields || []).map((x, idx) => normalizeFieldBuilderItem(x, idx));
    setFormFieldsList(normalized);

    // keep JSON preview for debugging (optional)
    try {
      setFormFieldsJson(JSON.stringify(normalized, null, 2));
    } catch {
      setFormFieldsJson("[]");
    }

    // Backend can return assigned users as usernames/emails or ids.
    const assignedRaw =
  f?.assigned_usernames ||
  f?.assignee_usernames ||
  f?.supervisor_usernames ||
  f?.assigned_users ||
  f?.assignees ||
  f?.assigned_user_ids ||
  f?.assignee_user_ids ||
  f?.supervisor_ids ||
  f?.assigned_to ||
  [];
    const keys = Array.isArray(assignedRaw)
      ? assignedRaw
      : typeof assignedRaw === "string"
      ? assignedRaw.split(",").map((s) => s.trim())
      : [];

      const normalizedKeys = keys
  .map((k) => {
    if (k && typeof k === "object") {
      return String(k?.username ?? k?.email ?? k?.name ?? "").trim();
    }
    return String(k ?? "").trim();
  })
  .filter(Boolean);

    const selected = normalizedKeys
  .map((k) => {
    const s = String(k).trim();
    if (!s) return null;

    const byUsername = userByUsername.get(s);
    if (byUsername) return byUsername;

    const n = Number(s);
    if (Number.isFinite(n)) {
      return (users || []).find((u) => Number(u?.id) === n) || null;
    }
    return null;
  })
  .filter(Boolean);

    setFormAssignees(selected);
    setEditFormOpen(true);
  };

  const saveForm = async () => {
    let payloadToSend = null;
    try {
      if (!editFormRow?.name?.trim()) {
        showAlert("warning", "Form name is required.");
        return;
      }

      // Source of truth is the builder list
      const schemaFields = builderToPayloadFields(formFieldsList);

      if (!schemaFields.length) {
        showAlert("warning", "Please add at least one field to the form.");
        return;
      }

      // Keep a JSON preview for debugging (optional)
      try {
        setFormFieldsJson(JSON.stringify(schemaFields, null, 2));
      } catch {
        // ignore
      }

      // Basic validation
      const seen = new Set();
      for (const f of schemaFields) {
        const fid = (f?.id ?? "").toString().trim();
        if (!fid) {
          showAlert("error", "Each field must have a non-empty id.");
          return;
        }
        if (seen.has(fid)) {
          showAlert("error", `Duplicate field id: ${fid}`);
          return;
        }
        seen.add(fid);
      }

      const payload = {
        name: editFormRow.name.trim(),
        type: (editFormRow.type || "inspection").trim(),
        is_active: typeof editFormRow.is_active === "boolean" ? editFormRow.is_active : true,
        schema: { fields: schemaFields },
        fields: schemaFields,
      };

      // Strip undefined values (just in case) and log what we're sending
      payloadToSend = JSON.parse(JSON.stringify(payload));
      if (payloadToSend?.schema?.fields?.some((x) => x?.id === undefined || x?.id === null || x?.id === "")) {
        console.warn("Some schema fields are missing id after serialization", payloadToSend.schema.fields);
      }
      console.log("/forms payloadToSend", payloadToSend);

      if (editFormRow?.id) {
        await authAxios.put(
          `/forms/${editFormRow.id}`,
          payloadToSend,
          { headers: { "Content-Type": "application/json" } }
        );
        showAlert("success", "Form updated.");
      } else {
        await authAxios.post(
          "/forms",
          payloadToSend,
          { headers: { "Content-Type": "application/json" } }
        );
        showAlert("success", "Form created.");
      }

      // Assign form to supervisors/users if endpoint exists
      // Prefer usernames/emails; keep backward compatibility with id-based payloads.
      try {
        const refreshed = await authAxios.get("/forms");
        const allForms = refreshed.data || [];
        setForms(allForms);
        const saved = editFormRow?.id
          ? allForms.find((x) => x.id === editFormRow.id)
          : allForms[allForms.length - 1];
        const formId = saved?.id;
        if (formId) {
          const usernames = (formAssignees || []).map((u) => u?.username).filter(Boolean);
          const userIds = (formAssignees || []).map((u) => u?.id).filter((v) => v !== undefined && v !== null);

          try {
            // Newer backend (email-based)
            await authAxios.post(`/forms/${formId}/assign`, { supervisor_usernames: usernames });
          } catch (e1) {
            // Older backend (id-based)
            await authAxios.post(`/forms/${formId}/assign`, { supervisor_ids: userIds });
          }
          // Refresh assignments shown in table
          fetchFormAssignments(await (async () => {
            try {
              const r = await authAxios.get("/forms");
              return r.data || [];
            } catch {
              return forms;
            }
          })());
        }
      } catch (assignErr) {
        console.warn("Form assignment failed (route may differ):", assignErr);
      }

      setEditFormOpen(false);
      setEditFormRow(null);
      setFormFieldsJson("[]");
      setFormFieldsList([]);
      setFormAssignees([]);
      fetchForms();
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;

      // If backend returns 422, show exactly what we sent (schema.fields)
      if (e?.response?.status === 422) {
        try {
          console.error("422 request payloadToSend", payloadToSend);
          showAlert(
            "error",
            `422 validation. Sent schema.fields: ${JSON.stringify(payloadToSend?.schema?.fields)}`
          );
        } catch (_) {
          // ignore
        }
      }

      const msg = Array.isArray(detail)
        ? detail
            .map((d) => {
              const loc = Array.isArray(d?.loc) ? d.loc.join(" → ") : "";
              const m = d?.msg || "Validation error";
              return loc ? `${loc}: ${m}` : m;
            })
            .join("; ")
        : typeof detail === "object" && detail
        ? JSON.stringify(detail)
        : detail || e?.message || "Failed to save form.";

      showAlert("error", msg);
    }
  };
  // EDIT RULE dropdowns
  const editSelectedFormNames = useMemo(
    () => (Array.isArray(editRow?.form_name) ? editRow.form_name : []),
    [editRow]
  );

  const editFieldOptions = useMemo(() => {
    if (!editSelectedFormNames.length) return [];

    const merged = new Map();
    editSelectedFormNames.forEach((name) => {
      (formFieldsByName.get(name) || []).forEach((d) => {
        if (!merged.has(d.key)) merged.set(d.key, d);
      });
    });

    return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [editSelectedFormNames, formFieldsByName]);

  const editSelectedFieldDef = useMemo(() => {
    const key = (editRow?.field || "").toString().trim();
    if (!key) return null;
    return editFieldOptions.find((d) => d.key === key) || null;
  }, [editRow, editFieldOptions]);

  const editOptionDropdown = useMemo(() => {
    const opts = editSelectedFieldDef?.options || [];
    return Array.isArray(opts) ? opts : [];
  }, [editSelectedFieldDef]);

  const deleteForm = async (f) => {
    if (!window.confirm(`Delete form "${f?.name}"?`)) return;
    try {
      try {
        await authAxios.delete(`/forms/${f.id}`);
      } catch (err) {
        const status = err?.response?.status;
        // Some backends expose delete as POST /forms/{id}/delete
        if (status === 405 || status === 404) {
          await authAxios.post(`/forms/${f.id}/delete`);
        } else {
          throw err;
        }
      }
      showAlert("success", "Form deleted.");
      fetchForms();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete form.";
      showAlert("error", msg);
    }
  };

const fetchRules = async () => {
  try {
    setLoadingRules(true);
        const params = {};

    const ruleIdQ = (filterRuleId || "").trim();
    const fieldQ = (filterField || "").trim();
    const formNameQ = (filterFormName || "").trim();
    const optionQ = (filterOptionValue || "").trim();

    if (ruleIdQ) params.rule_id = ruleIdQ;
    if (fieldQ) params.field = fieldQ;
    if (formNameQ) params.form_name = formNameQ;
    if (optionQ) params.option_value = optionQ;

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
      fetchActions(); // for action dropdowns
      fetchUsers(); // for assignee lists
      fetchForms(); // for form name dropdowns
      fetchRules();
    }
    if (activeTab === "users") fetchUsers();
    if (activeTab === "forms") {
      fetchUsers(); // for assignee lists
      fetchForms();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "rules") {
      fetchRules();
      // keep form names fresh in case forms were added/edited while staying on the tab
      if (!forms || forms.length === 0) fetchForms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRuleId, filterField, filterFormName, filterOptionValue, activeTab]);

  const uniqueRuleIds = useMemo(
    () => Array.from(new Set(rules.map((r) => r.rule_id))).sort((a, b) => a - b),
    [rules]
  );

  const userByUsername = useMemo(() => {
  const m = new Map();
  (users || []).forEach((u) => {
    const key = (u?.username ?? "").toString();
    if (key) m.set(key, u);
  });
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
  const handleEditAction = async (action) => {
  const newName = prompt("Edit action name:", action.name);
  if (!newName || !newName.trim()) return;
  try {
    await authAxios.put(`/actions/${action.id}`, { name: newName.trim() });
    showAlert("success", "Action updated successfully.");
    fetchActions();
  } catch (e) {
    console.error(e);
    showAlert("error", e?.response?.data?.detail || "Failed to update action.");
  }
};

const handleDeleteAction = async (action) => {
  if (!window.confirm(`Delete action "${action.name}"?`)) return;
  try {
    await authAxios.delete(`/actions/${action.id}`);
    showAlert("success", "Action deleted successfully.");
    fetchActions();
  } catch (e) {
    console.error(e);
    showAlert("error", e?.response?.data?.detail || "Failed to delete action.");
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

    if (
  !rule_id ||
  !Array.isArray(city) || city.length === 0 ||
  !field ||
  !Array.isArray(option_value) || option_value.length === 0 ||
  !action
) {
      showAlert("warning", "Please fill all required fields.");
      return;
    }

    try {
      const payload = {
  rule_id: rule_id.trim(),
  city,
  form_name:
    Array.isArray(createForm.form_name) && createForm.form_name.length > 0
      ? createForm.form_name
      : null,
  field: field.trim(),
  option_value,
  action,
  priority,
  assignee_user_id: createAssignee?.id ?? null,
};

      if (second_level_action && second_level_action.trim()) {
  payload.escalate_action = second_level_action.trim();
}
if (second_level_threshold !== "" && !Number.isNaN(Number(second_level_threshold))) {
  payload.escalate_threshold = Number(second_level_threshold);
}

      await authAxios.post("/inspection-rules", payload);
      showAlert("success", "Rule created.");
      setCreateForm({
  rule_id: "",
  city: [],
  form_name: [],
  field: "",
  option_value: [],
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
    city: Array.isArray(row.city)
      ? row.city
      : typeof row.city === "string"
      ? row.city.split(",").map((s) => s.trim())
      : [],
      form_name: Array.isArray(row.form_name)
  ? row.form_name
  : typeof row.form_name === "string" && row.form_name
  ? row.form_name.split(",").map((s) => s.trim()).filter(Boolean)
  : [],
    option_value: Array.isArray(row.option_value)
      ? row.option_value
      : typeof row.option_value === "string"
      ? row.option_value.split(",").map((s) => s.trim())
      : [],
    priority: row.priority || "None",
    second_level_action: (row.second_level_action ?? row.escalate_action) || "",
    second_level_threshold:
      typeof (row.second_level_threshold ?? row.escalate_threshold) === "number"
        ? String(row.second_level_threshold ?? row.escalate_threshold)
        : "",
  });
  const u = row.assignee_user_id ? userByUsername.get(String(row.assignee_user_id)) : null;
setEditAssignee(u || null);
  setEditOpen(true);
};

const saveEditRule = async () => {
  if (!editRow) return;
  try {
    const payload = {

      rule_id: editRow.rule_id?.trim() || "",
      city: Array.isArray(editRow.city) ? editRow.city : [editRow.city],
      form_name:
  Array.isArray(editRow.form_name) && editRow.form_name.length > 0
    ? editRow.form_name
    : null,
     field: (editRow.field || "").trim(),
      option_value: Array.isArray(editRow.option_value)
        ? editRow.option_value
        : [editRow.option_value],
      action: editRow.action || "",
      priority: editRow.priority || "None",
      assignee_user_id: editAssignee?.id ?? null,
      escalate_action: editRow.second_level_action?.trim() || null,
      escalate_threshold:
        editRow.second_level_threshold && !isNaN(Number(editRow.second_level_threshold))
          ? Number(editRow.second_level_threshold)
          : null,
    };

    if (
  !payload.rule_id ||
  !Array.isArray(payload.city) || payload.city.length === 0 ||
  !payload.field ||
  !Array.isArray(payload.option_value) || payload.option_value.length === 0
) {
      showAlert("warning", "Please fill all mandatory fields before saving.");
      return;
    }

    await authAxios.put(`/inspection-rules/${editRow.id}`, payload);
    showAlert("success", "Rule updated successfully.");
    setEditOpen(false);
    setEditRow(null);
    setEditAssignee(null);
    fetchRules();
  } catch (e) {
      console.error("Error updating rule:", e);
    const detail = e?.response?.data?.detail;

    if (Array.isArray(detail)) {
      // Backend validation errors (like 422)
      const msg = detail.map((d) => `${d.loc?.join(" → ")}: ${d.msg}`).join("; ");
      showAlert("error", msg);
    } else if (typeof detail === "object") {
      // Handle if backend returns a single object instead of list
      const msg = Object.values(detail).join("; ");
      showAlert("error", msg);
    } else {
      const msg = detail || e.message || "Failed to update rule.";
      showAlert("error", msg);
    }
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
    if (!editUserRow.username) {
      showAlert("warning", "Username is required.");
      return;
    }

    if (!editUserRow?.id) {
      // ✅ NEW user → call /register
      const payload = {
        username: editUserRow.username,
        role: editUserRow.role || "supervisor",
        password: newPassword || "changeme123", // You can require this instead
        full_name: editUserRow.full_name || null,
        badge_number: editUserRow.badge_number || null,
      };
      await authAxios.post("/register", payload);
      showAlert("success", "User created successfully.");
    } else {
      // ✅ Existing user → update
      const form = new FormData();
      if (editUserRow.role) form.append("role", editUserRow.role);
      if (typeof editUserRow.is_verified === "boolean")
        form.append("is_verified", String(editUserRow.is_verified));
      if (newPassword) form.append("new_password", newPassword);
      if (editUserRow.full_name != null) form.append("full_name", editUserRow.full_name);
      if (editUserRow.badge_number != null) form.append("badge_number", editUserRow.badge_number);

      await authAxios.put(`/users/by-username/${encodeURIComponent(editUserRow.username)}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showAlert("success", "User updated successfully.");
    }

    setEditUserOpen(false);
    setEditUserRow(null);
    setNewPassword("");
    fetchUsers();
  } catch (e) {
    console.error(e);
    const msg = e?.response?.data?.detail || "Failed to save user.";
    showAlert("error", msg);
  }
};
const deleteUser = async (user) => {
  if (!window.confirm(`Delete user "${user.username}"?`)) return;
  try {
    await authAxios.delete(`/users/by-username/${encodeURIComponent(user.username)}`);
    showAlert("success", "User deleted successfully.");
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
    // If you store as string sometimes, coerce with Number(v) and check !Number.isNaN
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
    <TableCell align="right">Actions</TableCell>
  </TableRow>
</TableHead>
            <TableBody>
  {actions.map((a) => (
    <TableRow key={a.id} hover>
      <TableCell>{a.id}</TableCell>
      <TableCell>{a.name}</TableCell>
      <TableCell align="right">
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEditAction(a)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => handleDeleteAction(a)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
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
  <TextField
    label="Rule Name"
    value={createForm.rule_id}
    onChange={(e) => setCreateForm((s) => ({ ...s, rule_id: e.target.value }))}
    size="small"
    placeholder="e.g. Helmet missing"
    helperText="Use a short descriptive name"
    sx={{ width: '100%' }}
  />

<FormControl size="small" sx={{ width: '100%' }}>
  <InputLabel>City</InputLabel>
  <Select
    multiple
    value={createForm.city || []}
    onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))}
    label="City"
    renderValue={(selected) => selected.join(", ")}
  >
    {CITY_OPTIONS.map((c) => (
      <MenuItem key={c} value={c}>{c}</MenuItem>
    ))}
  </Select>
</FormControl>
<FormControl size="small" sx={{ width: "100%" }}>
  <InputLabel>Form Name (optional)</InputLabel>
  <Select
    multiple
    value={createForm.form_name || []}
    onChange={(e) => setCreateForm((s) => ({ ...s, form_name: e.target.value }))}
    label="Form Name (optional)"
    renderValue={(selected) => selected.join(", ")}
  >
    {formNameOptions.map((n) => (
      <MenuItem key={n} value={n}>{n}</MenuItem>
    ))}
  </Select>
</FormControl>

  {createSelectedFormNames.length > 0 ? (
  <Autocomplete
    options={createFieldOptions}
    value={createSelectedFieldDef}
    onChange={(_, v) =>
      setCreateForm((s) => ({
        ...s,
        field: v?.key || "",
        option_value: [], // reset options when field changes
      }))
    }
    getOptionLabel={(o) => (o?.label ? `${o.label} (${o.key})` : o?.key || "")}
    isOptionEqualToValue={(a, b) => a?.key === b?.key}
    renderInput={(params) => (
      <TextField {...params} label="Field" size="small" helperText="Pick a field from the selected form." />
    )}
  />
) : (
  <TextField
    label="Field (JSON key)"
    value={createForm.field}
    onChange={(e) => setCreateForm((s) => ({ ...s, field: e.target.value }))}
    size="small"
    helperText="Select a form to get a dropdown. Or type a key manually."
    sx={{ width: "100%" }}
  />
)}

  <Autocomplete
  multiple
  freeSolo={createSelectedFormNames.length === 0 || createOptionDropdown.length === 0}
  options={createOptionDropdown}
  value={createForm.option_value || []}
  onChange={(_, v) => setCreateForm((s) => ({ ...s, option_value: v }))}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Option values"
      size="small"
      helperText={
        createSelectedFormNames.length > 0
          ? createOptionDropdown.length > 0
            ? "Pick one or more values from the form field options."
            : "This field has no predefined options. You can type values."
          : "Select a form + field to get option dropdowns, or type values."
      }
      placeholder={createOptionDropdown.length > 0 ? "Choose values" : "Type and press Enter"}
    />
  )}
/>

  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
    <FormControl size="small" sx={{ flex: 1 }}>
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

    <FormControl size="small" sx={{ flex: 1 }}>
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
  </Stack>

  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
    <FormControl size="small" sx={{ flex: 1 }}>
      <InputLabel>2nd-level Action (optional)</InputLabel>
      <Select
        value={createForm.second_level_action}
        onChange={(e) => setCreateForm((s) => ({ ...s, second_level_action: e.target.value }))}
        label="2nd-level Action (optional)"
      >
        {actions.map((a) => (
          <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      label="2nd-level Threshold (optional)"
      type="number"
      value={createForm.second_level_threshold}
      onChange={(e) => setCreateForm((s) => ({ ...s, second_level_threshold: e.target.value }))}
      size="small"
      sx={{ flex: 1 }}
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
        sx={{ width: '100%' }}
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

  <Button type="submit" variant="contained" startIcon={<AddIcon />}>
    Create Rule
  </Button>
</Stack>
</Paper>

      {/* Manage Rules */}
      <Paper sx={{ p: 2, width: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Active Rules</Typography>
    <Stack direction="row" spacing={2} alignItems="center">
  <TextField
    label="Filter by Rule Name"
    size="small"
    value={filterRuleId}
    onChange={(e) => setFilterRuleId(e.target.value)}
    sx={{ width: 180 }}
  />

  <TextField
    label="Filter by Field"
    size="small"
    value={filterField}
    onChange={(e) => setFilterField(e.target.value)}
    sx={{ width: 180 }}
  />

  <TextField
    label="Filter by Option"
    size="small"
    value={filterOptionValue}
    onChange={(e) => setFilterOptionValue(e.target.value)}
    sx={{ width: 180 }}
  />

  <FormControl size="small" sx={{ minWidth: 200 }}>
    <InputLabel>Form Name</InputLabel>
    <Select
      value={filterFormName}
      onChange={(e) => setFilterFormName(e.target.value)}
      label="Form Name"
    >
      <MenuItem value="">All</MenuItem>
      {formNameOptions.map((n) => (
        <MenuItem key={n} value={n}>{n}</MenuItem>
      ))}
    </Select>
  </FormControl>

  <Button
    variant="outlined"
    startIcon={<FilterAltIcon />}
    onClick={() => { setPageRules(0); fetchRules(); }}
  >
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
                  <TableCell>Form Name</TableCell>
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
                {filteredRules.slice(pageRules * rppRules, pageRules * rppRules + rppRules).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.rule_id}</TableCell>
                   <TableCell>
  {Array.isArray(row.city) ? row.city.join(", ") : row.city}
</TableCell>
<TableCell>
  {Array.isArray(row.form_name) ? row.form_name.join(", ") : row.form_name || "—"}
</TableCell>
                    <TableCell>{row.field}</TableCell>
                    <TableCell>
  {Array.isArray(row.option_value) ? row.option_value.join(", ") : row.option_value}
</TableCell>
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
                    <TableCell>{row.assignee_username || row.assignee_user_id || "—"}</TableCell>
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
                {!loadingRules && filteredRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
          count={filteredRules.length}
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
  label="Rule Name"
  value={editRow.rule_id}
  onChange={(e) => setEditRow((s) => ({ ...s, rule_id: e.target.value }))}

/>
              <FormControl fullWidth size="small">
  <InputLabel>City</InputLabel>
 <Select
  multiple
  value={editRow.city || []}
  onChange={(e) => setEditRow((s) => ({ ...s, city: e.target.value }))}
  renderValue={(selected) => selected.join(", ")}
  label="City"
>
    {CITY_OPTIONS.map((c) => (
      <MenuItem key={c} value={c}>{c}</MenuItem>
    ))}
  </Select>
</FormControl>

<FormControl fullWidth size="small">
  <InputLabel>Form Name (optional)</InputLabel>
  <Select
    multiple
    value={editRow.form_name || []}
    onChange={(e) => setEditRow((s) => ({ ...s, form_name: e.target.value }))}
    renderValue={(selected) => selected.join(", ")}
    label="Form Name (optional)"
  >
    {formNameOptions.map((n) => (
      <MenuItem key={n} value={n}>{n}</MenuItem>
    ))}
  </Select>
</FormControl>
              {editSelectedFormNames.length > 0 ? (
                <Autocomplete
                  options={editFieldOptions}
                  value={editSelectedFieldDef}
                  onChange={(_, v) =>
                    setEditRow((s) => ({
                      ...s,
                      field: v?.key || "",
                      option_value: [], // reset options when field changes
                    }))
                  }
                  getOptionLabel={(o) => (o?.label ? `${o.label} (${o.key})` : o?.key || "")}
                  isOptionEqualToValue={(a, b) => a?.key === b?.key}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Field"
                      size="small"
                      helperText="Pick a field from the selected form."
                    />
                  )}
                />
              ) : (
                <TextField
                  label="Field (JSON key)"
                  value={editRow.field}
                  onChange={(e) => setEditRow((s) => ({ ...s, field: e.target.value }))}
                  size="small"
                  helperText="Select a form to get a dropdown. Or type a key manually."
                />
              )}
              <Autocomplete
                multiple
                freeSolo={editSelectedFormNames.length === 0 || editOptionDropdown.length === 0}
                options={editOptionDropdown}
                value={Array.isArray(editRow.option_value) ? editRow.option_value : []}
                onChange={(_, v) => setEditRow((s) => ({ ...s, option_value: v }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Option values"
                    size="small"
                    helperText={
                      editSelectedFormNames.length > 0
                        ? editOptionDropdown.length > 0
                          ? "Pick one or more values from the form field options."
                          : "This field has no predefined options. You can type values."
                        : "Select a form + field to get option dropdowns, or type values."
                    }
                    placeholder={editOptionDropdown.length > 0 ? "Choose values" : "Type and press Enter"}
                  />
                )}
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
const [userSearch, setUserSearch] = useState("");
const filteredUsers = users.filter(u =>
  u.username?.toLowerCase().includes(userSearch.toLowerCase())
);

const openCreateUser = () => {
  setEditUserRow({ username: "", role: "supervisor", is_verified: false, full_name: "", badge_number: "" });
  setNewPassword("");
  setEditUserOpen(true);
};
  const UsersPane = (
    <Paper sx={{ p: 2, width: "100%" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Users
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
  <TextField
    size="small"
    label="Search users"
    value={userSearch}
    onChange={(e) => setUserSearch(e.target.value)}
    sx={{ maxWidth: 300 }}
  />
  <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateUser}>
    Create User
  </Button>
</Stack>
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
                <TableCell>Full Name</TableCell>
                <TableCell>Badge #</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(userPage * userRpp, userPage * userRpp + userRpp)
                .map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell>{u.badge_number || "—"}</TableCell>
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
              {!loadingUsers && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
              <TextField
  label="Username"
  value={editUserRow.username}
  onChange={(e) => setEditUserRow((s) => ({ ...s, username: e.target.value }))}
  InputProps={{ readOnly: !!editUserRow?.id }} // editable only for new users
/>
              <FormControl>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={editUserRow.role || ""}
                  onChange={(e) => setEditUserRow((s) => ({ ...s, role: e.target.value }))}
                >
                  <MenuItem value="admin">admin</MenuItem>
                  <MenuItem value="supervisor">supervisor</MenuItem>
                <MenuItem value="user">user</MenuItem>
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
                label="Full Name"
                value={editUserRow.full_name || ""}
                onChange={(e) => setEditUserRow((s) => ({ ...s, full_name: e.target.value }))}
              />
              <TextField
                label="Badge Number"
                value={editUserRow.badge_number || ""}
                onChange={(e) => setEditUserRow((s) => ({ ...s, badge_number: e.target.value }))}
              />
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
    // ====== Forms pane UI ======
  const filteredForms = forms.filter((f) =>
    (f?.name || "").toLowerCase().includes(formSearch.toLowerCase())
  );

  const FormsPane = (
    <Paper sx={{ p: 2, width: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Forms
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
          Create Form
        </Button>
      </Stack>

      <TextField
        size="small"
        label="Search forms"
        value={formSearch}
        onChange={(e) => setFormSearch(e.target.value)}
        sx={{ maxWidth: 360, mb: 2 }}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ width: "100%" }}>
        {loadingForms ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader size="small" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Assigned to</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredForms
                .slice(formPage * formRpp, formPage * formRpp + formRpp)
                .map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>{f.id}</TableCell>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.type || "inspection"}</TableCell>
                    <TableCell>{f.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {(() => {
                        const key = String(f?.id ?? "");
                        const arr = formAssignmentsById?.[key];

                        if (loadingFormAssignments && arr === undefined) return "…";
                        if (Array.isArray(arr) && arr.length > 0) return arr.join(", ");

                        // Fallback: sometimes backend may include assignments on the form payload
                        const fallback = formatAssignedUsers(f, users);
                        return fallback && fallback !== "—" ? fallback : "—";
                      })()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => openEditForm(f)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => deleteForm(f)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {!loadingForms && filteredForms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No forms found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredForms.length}
        page={formPage}
        onPageChange={(_, p) => setFormPage(p)}
        rowsPerPage={formRpp}
        onRowsPerPageChange={(e) => {
          setFormRpp(parseInt(e.target.value, 10));
          setFormPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Create/Edit form dialog */}
      <Dialog open={editFormOpen} onClose={() => setEditFormOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editFormRow?.id ? "Edit Form" : "Create Form"}</DialogTitle>
        <DialogContent dividers>
          {editFormRow && (
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={editFormRow.name}
                onChange={(e) => setEditFormRow((s) => ({ ...s, name: e.target.value }))}
              />
              <FormControl size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={editFormRow.type || "Rider"}
                  onChange={(e) => setEditFormRow((s) => ({ ...s, type: e.target.value }))}
                >
                  <MenuItem value="Rider">Rider</MenuItem>
                  <MenuItem value="Partner">Partner</MenuItem>
                  <MenuItem value="Supervisor">Supervisor</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>Active</InputLabel>
                <Select
                  label="Active"
                  value={editFormRow.is_active ? "true" : "false"}
                  onChange={(e) =>
                    setEditFormRow((s) => ({ ...s, is_active: e.target.value === "true" }))
                  }
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
    <Typography variant="subtitle1" fontWeight={700}>
      Fields
    </Typography>

    <Button
      size="small"
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={() =>
        setFormFieldsList((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          (() => {
            const n = (prev?.length || 0) + 1;
            const id = `field_${n}`;
            return { id, key: id, label: "", type: "text", required: false, multi: false, options: [], options_text: "" };
          })(),
        ])
      }
    >
      Add field
    </Button>
  </Stack>

  {(formFieldsList || []).length === 0 ? (
    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
      No fields yet. Click “Add field”.
    </Typography>
  ) : (
    <Stack spacing={1.5}>
      {(formFieldsList || []).map((f, idx) => {
        const typeLower = (f?.type || "text").toString().toLowerCase();
        return (
          <Box
            key={`${f?.id || idx}-${idx}`}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 160px 140px 140px 1fr 44px" },
              gap: 1,
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              label="Label"
              value={f?.label ?? ""}
              onChange={(e) => {
                const newLabel = e.target.value;
                setFormFieldsList((prev) =>
                  prev.map((x, i) => {
                    if (i !== idx) return x;

                    // Only auto-generate id/key once (when empty)
                    if (!x.id) {
                      const newId = slugifyFieldId(newLabel);
                      return { ...x, label: newLabel, id: newId, key: newId };
                    }

                    return { ...x, label: newLabel };
                  })
                );
              }}
            />

            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={f?.type ?? "text"}
                onChange={(e) =>
                  setFormFieldsList((prev) =>
                    prev.map((x, i) =>
                      i === idx
                        ? {
                            ...x,
                            type: e.target.value,
                            options: e.target.value.toString().toLowerCase() === "select" ? (x.options || []) : [],
                            options_text: e.target.value.toString().toLowerCase() === "select" ? (x.options_text || "") : "",
                            multi: e.target.value.toString().toLowerCase() === "select" ? Boolean(x.multi ?? false) : false,
                          }
                        : x
                    )
                  )
                }
              >
                <MenuItem value="text">text</MenuItem>
                <MenuItem value="select">select</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Required</InputLabel>
              <Select
                label="Required"
                value={f?.required ? "true" : "false"}
                onChange={(e) =>
                  setFormFieldsList((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, required: e.target.value === "true" } : x))
                  )
                }
              >
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Answer type</InputLabel>
              <Select
                label="Answer type"
                value={typeLower === "select" ? (f?.multi ? "multi" : "single") : "single"}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormFieldsList((prev) =>
                    prev.map((x, i) =>
                      i === idx
                        ? {
                            ...x,
                            multi: v === "multi",
                          }
                        : x
                    )
                  );
                }}
                disabled={typeLower !== "select"}
              >
                <MenuItem value="single">Single answer</MenuItem>
                <MenuItem value="multi">Multi-select</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label={typeLower === "select" ? "Options (one per line)" : "Options"}
              value={
                typeLower === "select"
                  ? (f?.options_text ?? (Array.isArray(f?.options) ? f.options.join("\n") : ""))
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value;
                setFormFieldsList((prev) =>
                  prev.map((x, i) => {
                    if (i !== idx) return x;
                    if (typeLower !== "select") return { ...x, options_text: "", options: [] };

                    const options = raw
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);

                    return { ...x, options_text: raw, options };
                  })
                );
              }}
              onKeyDown={(e) => {
                // Prevent Dialog/parent handlers from hijacking Enter
                if (e.key === "Enter") e.stopPropagation();
              }}
              disabled={typeLower !== "select"}
              placeholder={typeLower === "select" ? "OK\nNOK\nNeeds review, urgent" : "—"}
              multiline
              minRows={3}
            />

            <Tooltip title="Remove">
              <IconButton
                size="small"
                color="error"
                onClick={() => setFormFieldsList((prev) => prev.filter((_, i) => i !== idx))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}

      <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
        Tip: The field key is auto-generated from the Label (ex: "Box Serial" → "box_serial"). Options are one per line (commas are allowed inside a line).
      </Typography>
    </Stack>
  )}
</Box>

              <Autocomplete
                multiple
                options={users}
                loading={loadingUsers}
                getOptionLabel={(o) => o?.username ?? ""}
                value={formAssignees}
                onChange={(_, v) => setFormAssignees(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.username}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign to supervisors/users"
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
          <Button onClick={() => setEditFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveForm}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  return (
        <Box sx={{ bgcolor: "#f7fafd", minHeight: "100vh", width: "100vw", overflowX: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
        </Typography>
      <Box
          sx={{
                      display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 3,
            width: "100%",
            flexGrow: 1,
            height: "calc(100vh - 120px)", // makes the panel taller
            overflow: "hidden",
          }}
        >
                  {/* Sidebar */}
          <Paper
            elevation={1}
            sx={{
              width: 250,
              flexShrink: 0,
              height: "fit-content",
            }}
          >
            <Sidebar activeTab={activeTab} onChange={setActiveTab} />
          </Paper>

              {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              bgcolor: "white",
              p: 3,
              borderRadius: 2,
              boxShadow: 2,
              height: "100%",
              overflowY: "auto",
            }}
          >
            {activeTab === "actions" && ActionsPane}
            {activeTab === "rules" && RulesPane}
            {activeTab === "users" && UsersPane}
            {activeTab === "forms" && FormsPane}
          </Box>
      </Box>

              {/* Snackbar */}
        <Snackbar open={alert.open} autoHideDuration={3500} onClose={closeAlert}>
          <Alert onClose={closeAlert} severity={alert.severity} variant="filled">
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
);
}
