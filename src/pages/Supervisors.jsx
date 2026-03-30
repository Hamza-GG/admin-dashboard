// src/pages/Supervisors.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Card,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import InsightsIcon from "@mui/icons-material/Insights";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";

// Fallback Leaflet marker (keeps default look)
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Start/End icons for trajectory
const startIcon = L.divIcon({
  className: "traj-marker traj-start",
  html: '<div class="traj-dot">S</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const endIcon = L.divIcon({
  className: "traj-marker traj-end",
  html: '<div class="traj-dot">E</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const trajMarkerCss = `
  .traj-marker .traj-dot{
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight:900;
    font-size: 14px;
    color:#fff;
    border: 2px solid rgba(255,255,255,0.95);
    box-shadow: 0 6px 16px rgba(0,0,0,0.25);
  }
  .traj-start .traj-dot{ background: #2e7d32; }
  .traj-end .traj-dot{ background: #c62828; }
`;

const normalizeTs = (v) => {
  if (typeof v !== "string") return v;
  // handle microseconds like .266138 -> keep only .266
  return v.replace(/(\.\d{3})\d+/, "$1");
};

const safeDate = (v) => {
  const d = new Date(normalizeTs(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

// --- Morocco timezone helpers (avoid UTC shifting from toISOString) ---
const MA_TZ = "Africa/Casablanca";

const getYMDInTz = (date, timeZone = MA_TZ) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const da = parts.find((p) => p.type === "day")?.value;
  return y && m && da ? `${y}-${m}-${da}` : null;
};

// Extract inspection control timestamp (supports multiple shapes)
const getInspectionDate = (ins) => {
  // Common candidates
  const ts =
    ins?.control_time ||
    ins?.timestamp ||
    ins?.fields?.control_time ||
    ins?.fields?.controlTime ||
    ins?.fields?.control_timestamp ||
    ins?.fields?.controlTimestamp ||
    ins?.fields?.created_at ||
    ins?.created_at;

  return safeDate(ts);
};

// Helper to fit bounds to markers when data/filters change
function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const clean = (points || [])
      .map((p) => {
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng ?? p.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...p, latitude: lat, longitude: lng };
      })
      .filter(Boolean);

    if (clean.length === 0) return;

    if (clean.length === 1) {
      map.setView([clean[0].latitude, clean[0].longitude], 13, { animate: true });
    } else {
      const bounds = L.latLngBounds(clean.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);

  return null;
}

export default function Supervisors() {
  const [locations, setLocations] = useState([]);
  const [locationPings, setLocationPings] = useState([]); // raw pings for trajectories
  const [allSupervisors, setAllSupervisors] = useState([]); // full supervisors list for filter
  const [selectedUser, setSelectedUser] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const fetchLocations = async () => {
    try {
      // Prefer full pings if backend supports it
      const res = await authAxios.get("/api/locations");
      setLocationPings(res.data || []);

      // Also keep last-locations for a cheap fallback / overview
      const last = await authAxios.get("/api/last-locations");
      setLocations(last.data || []);
    } catch (err) {
      // Fallback: only last locations
      try {
        const last = await authAxios.get("/api/last-locations");
        setLocations(last.data || []);
      } catch (e2) {
        console.error("Failed to fetch supervisor locations", err);
      }
    }
  };

  const fetchInspections = async () => {
    try {
      const res = await authAxios.get("/inspections");
      setInspections(res.data || []);
    } catch (err) {
      console.error("Failed to fetch inspections", err);
    }
  };

  const fetchSupervisors = async () => {
    try {
      // Preferred: users endpoint (used by Settings > Users)
      const res = await authAxios.get("/users");
      const users = res.data || [];
      const sups = users
        .filter((u) => String(u.role || "").toLowerCase() === "supervisor")
        .map((u) => u.username)
        .filter(Boolean);
      setAllSupervisors(Array.from(new Set(sups)).sort());
      return;
    } catch (e1) {
      // Fallback: supervisors endpoint (if present)
      try {
        const res2 = await authAxios.get("/supervisors");
        const sups2 = (res2.data || [])
          .map((u) => u.username || u.email || u.name)
          .filter(Boolean);
        setAllSupervisors(Array.from(new Set(sups2)).sort());
        return;
      } catch (e2) {
        // Last fallback: keep empty; UI will fall back to location-based list
        console.warn("Failed to fetch supervisors list", e1);
      }
    }
  };

  // initial + poll every 60s
  useEffect(() => {
    fetchLocations();
    fetchInspections();
    fetchSupervisors();
    const dataInterval = setInterval(() => {
      fetchLocations();
      fetchInspections();
      fetchSupervisors();
    }, 60_000); // refresh data

    return () => {
      clearInterval(dataInterval);
    };
  }, []);

  const usernames = useMemo(() => {
    if (allSupervisors && allSupervisors.length > 0) return allSupervisors;
    // Fallback to last-locations if supervisors list endpoint isn't available
    return Array.from(new Set((locations || []).map((l) => l.username))).sort();
  }, [allSupervisors, locations]);

  const filtered = useMemo(() => {
    return selectedUser ? locations.filter(l => l.username === selectedUser) : locations;
  }, [locations, selectedUser]);

  // --- Today trajectory (for selected supervisor) ---
  // NOTE: Backend already returns only today's pings (Morocco time). We only need to
  // filter by username and sort by timestamp.
  const todayTrajectory = useMemo(() => {
    if (!selectedUser) return [];

    const target = String(selectedUser).trim().toLowerCase();

    const pts = (locationPings || [])
      .filter((p) => {
        const u = String(p.username ?? p.supervisor_username ?? p.user ?? p.inspected_by ?? "")
          .trim()
          .toLowerCase();
        return u === target;
      })
      .map((p) => {
        const d = safeDate(p.timestamp || p.created_at || p.created_at_local);
        if (!d) return null;
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng ?? p.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...p, __d: d, __lat: lat, __lng: lng };
      })
      .filter(Boolean)
      .sort((a, b) => a.__d - b.__d);

    return pts;
  }, [locationPings, selectedUser]);

  // Points used for FitBounds + markers:
  // - If a supervisor is selected: use trajectory points if available,
  //   otherwise fallback to last known location for that supervisor
  // - Otherwise: use the last known locations list
  const mapPoints = useMemo(() => {
    if (selectedUser) {
      if (todayTrajectory.length > 0) {
        return todayTrajectory.map((p) => ({
          latitude: p.__lat,
          longitude: p.__lng,
          username: p.username ?? p.supervisor_username ?? p.user ?? selectedUser,
          user_id: p.user_id,
          timestamp: p.timestamp || p.created_at || p.created_at_local,
        }));
      }
      // fallback: show last known location for that supervisor if no pings today
      const target = String(selectedUser).trim().toLowerCase();
      return (locations || []).filter(
        (l) => String(l.username || "").trim().toLowerCase() === target
      );
    }
    return filtered;
  }, [selectedUser, todayTrajectory, filtered, locations]);

  const polylinePositions = useMemo(() => {
    return todayTrajectory.map((p) => [p.__lat, p.__lng]);
  }, [todayTrajectory]);

  // Calculate inspection stats (safe parsing) using Morocco day
  const now = new Date();
  const todayYMD = getYMDInTz(now);
  const startTodayDate = todayYMD ? new Date(`${todayYMD}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Week start: Sunday (Morocco local)
  const nowMa = safeDate(now);
  const dow = nowMa ? Number(new Intl.DateTimeFormat("en-US", { timeZone: MA_TZ, weekday: "short" }).format(nowMa).slice(0, 3) !== "" ) : null;
  const startWeekDate = new Date(startTodayDate);
  // Use JS local week math as approximation; day labels below are TZ-correct
  startWeekDate.setDate(startTodayDate.getDate() - startTodayDate.getDay());

  // If a supervisor is selected, show stats for that supervisor only
  const inspectionsForStats = useMemo(() => {
    if (!selectedUser) return inspections;
    const target = String(selectedUser).trim().toLowerCase();
    return (inspections || []).filter(
      (ins) => String(ins.inspected_by || "").trim().toLowerCase() === target
    );
  }, [inspections, selectedUser]);

  const totalToday = (inspectionsForStats || []).filter((ins) => {
    const d = getInspectionDate(ins);
    if (!d) return false;
    return d >= startTodayDate && d <= now;
  }).length;

  const totalWeek = (inspectionsForStats || []).filter((ins) => {
    const d = getInspectionDate(ins);
    if (!d) return false;
    return d >= startWeekDate && d <= now;
  }).length;

  // Count inspections by inspector
  const inspectorCounts = inspections.reduce((acc, ins) => {
    const name = ins.inspected_by || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topInspectors = Object.entries(inspectorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Prepare data for last 10 days for performance tab (Morocco dates)
  const daysToShow = 10;
  const dateLabels = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ymd = getYMDInTz(d);
    if (ymd) dateLabels.push(ymd);
  }

  // Group inspections by inspector and by day
  const inspectionsLast10Days = inspectionsForStats.filter((ins) => {
    const d = getInspectionDate(ins);
    if (!d) return false;
    const dayStr = getYMDInTz(d);
    return dayStr ? dateLabels.includes(dayStr) : false;
  });

  const inspectionsByInspector = {};
  inspectionsLast10Days.forEach(ins => {
    const name = ins.inspected_by || "Unknown";
    if (!inspectionsByInspector[name]) {
      inspectionsByInspector[name] = {};
    }
    const d = getInspectionDate(ins);
    if (!d) return;
    const dayStr = getYMDInTz(d);
    inspectionsByInspector[name][dayStr] = (inspectionsByInspector[name][dayStr] || 0) + 1;
  });

  // Build combined chart data: sum counts for all inspectors per day
  const combinedChartData = dateLabels.map(date => {
    let totalCount = 0;
    Object.values(inspectionsByInspector).forEach(dayCounts => {
      totalCount += dayCounts[date] || 0;
    });
    return { date, count: totalCount };
  });

  // Total inspections last 10 days per inspector
  const inspectionsCountLast10Days = {};
  Object.entries(inspectionsByInspector).forEach(([name, dayCounts]) => {
    inspectionsCountLast10Days[name] = Object.values(dayCounts).reduce((a, b) => a + b, 0);
  });

  // Casablanca fallback center
  const fallbackCenter = [33.5899, -7.6039];

  const commonBoxSx = {
    flexGrow: 1,
    bgcolor: "#fafafa",
    p: 2,
    borderTop: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
        p: 0,
        bgcolor: "#f9f9f9",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Settings-like left switch panel + content */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          px: 2,
          pt: 2,
          alignItems: "flex-start",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: 220,
            borderRadius: 2,
            position: "sticky",
            top: 16,
            zIndex: 1100,
          }}
        >
          <Box sx={{ p: 1.5, pb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Panneau
            </Typography>
          </Box>
          <List sx={{ px: 1, pb: 1 }}>
            <ListItemButton
              selected={activeTab === 0}
              onClick={() => setActiveTab(0)}
              sx={{ borderRadius: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <MapIcon />
              </ListItemIcon>
              <ListItemText primary="Carte" />
            </ListItemButton>

            <ListItemButton
              selected={activeTab === 1}
              onClick={() => setActiveTab(1)}
              sx={{ borderRadius: 1.5, mt: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InsightsIcon />
              </ListItemIcon>
              <ListItemText primary="Performance" />
            </ListItemButton>
          </List>
        </Paper>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header area (matches Settings page feeling) */}
          <Paper
            elevation={3}
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              px: 2,
              py: 1.5,
              mb: 2,
            }}
          >
            {activeTab === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {selectedUser
                    ? "🧭 Trajectoire du jour"
                    : "📍 Dernières localisations des superviseurs"}
                </Typography>

                <Autocomplete
                  size="small"
                  options={usernames}
                  value={selectedUser}
                  onChange={(_, v) => setSelectedUser(v)}
                  renderInput={(params) => (
                    <TextField {...params} label="Superviseur" />
                  )}
                  clearOnEscape
                  sx={{ minWidth: 260 }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Performance
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  {selectedUser ? (
                    <Typography variant="body2" color="text.secondary">
                      Filtré sur: <strong>{selectedUser}</strong>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Tous les superviseurs
                    </Typography>
                  )}

                  <Autocomplete
                    size="small"
                    options={usernames}
                    value={selectedUser}
                    onChange={(_, v) => setSelectedUser(v)}
                    renderInput={(params) => (
                      <TextField {...params} label="Superviseur" />
                    )}
                    clearOnEscape
                    sx={{ minWidth: 260 }}
                  />
                </Box>
              </Box>
            )}
          </Paper>

          {/* Content */}
          {activeTab === 0 && (
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                zIndex: 0,
                width: "100%",
                mt: activeTab === 0 ? 0 : 0,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  p: 1,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                  backgroundColor: "#fff",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    height: activeTab === 0 ? "70vh" : "0",
                    width: "100%",
                    overflow: "hidden",
                    borderRadius: 2,
                    backgroundColor: "#f4f6f8",
                    transition: "height 0.3s ease",
                    zIndex: 0,
                    position: "relative",
                  }}
                >
                  <MapContainer
                    center={fallbackCenter}
                    zoom={5}
                    style={{ height: "100%", width: "100%", borderRadius: 'inherit' }}
                    preferCanvas
                  >
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution='Tiles &copy; Esri'
                    />

                    <FitBounds points={mapPoints} />
                    <style>{trajMarkerCss}</style>

                    {/* If a supervisor is selected, draw today's trajectory */}
                    {selectedUser && polylinePositions.length >= 2 && (
                      <Polyline positions={polylinePositions} />
                    )}

                    {/* Markers */}
                    {selectedUser && todayTrajectory.length > 0 ? (
                      <>
                        {/* Start point */}
                        <Marker
                          key={`start-${selectedUser}`}
                          position={[todayTrajectory[0].__lat, todayTrajectory[0].__lng]}
                          icon={startIcon}
                        >
                          <Popup>
                            <strong>{selectedUser}</strong>
                            <br />
                            Départ: {(() => {
                              const d = safeDate(todayTrajectory[0].timestamp || todayTrajectory[0].created_at || todayTrajectory[0].created_at_local);
                              return d
                                ? d.toLocaleString("fr-MA", {
                                    timeZone: "Africa/Casablanca",
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "";
                            })()}
                          </Popup>
                        </Marker>

                        {/* End point */}
                        <Marker
                          key={`end-${selectedUser}`}
                          position={[todayTrajectory[todayTrajectory.length - 1].__lat, todayTrajectory[todayTrajectory.length - 1].__lng]}
                          icon={endIcon}
                        >
                          <Popup>
                            <strong>{selectedUser}</strong>
                            <br />
                            Arrivée: {(() => {
                              const last = todayTrajectory[todayTrajectory.length - 1];
                              const d = safeDate(last.timestamp || last.created_at || last.created_at_local);
                              return d
                                ? d.toLocaleString("fr-MA", {
                                    timeZone: "Africa/Casablanca",
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "";
                            })()}
                          </Popup>
                        </Marker>
                      </>
                    ) : (
                      mapPoints.map((loc, idx) => (
                        <Marker
                          key={`${loc.user_id || loc.username || "u"}-${loc.timestamp || idx}`}
                          position={[Number(loc.latitude), Number(loc.longitude)]}
                          icon={defaultIcon}
                        >
                          <Popup>
                            <strong>{loc.username}</strong>
                            <br />
                            {(() => {
                              const d = safeDate(loc.timestamp);
                              return d
                                ? d.toLocaleString("fr-MA", {
                                    timeZone: "Africa/Casablanca",
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "";
                            })()}
                          </Popup>
                        </Marker>
                      ))
                    )}
                  </MapContainer>
                </Box>
              </Paper>
            </Box>
          )}
          {activeTab === 1 && (() => {
            // --- Highlight logic for min/max per column ---
            // Compute per-day min/max, ignoring 0 only if all are zero for that day
            const dayStats = {};
            dateLabels.forEach(date => {
              const values = Object.keys(inspectionsByInspector).map(name =>
                inspectionsByInspector[name][date] || 0
              );
              let min = Math.min(...values);
              let max = Math.max(...values);
              if (values.every(v => v === 0)) {
                min = max = 0;
              }
              dayStats[date] = { min, max };
            });
            // Style helpers
            const highlightCellSx = (val, date) => {
              const { min, max } = dayStats[date];
              if (val === max && max !== min) {
                // Highlight max (green)
                return {
                  background: 'linear-gradient(90deg, #d4f9e2 70%, #b7f4c0 100%)',
                  color: '#137333',
                  fontWeight: 900,
                  boxShadow: '0 0 10px 1px #b2f2d8',
                  transition: 'background 0.18s, box-shadow 0.18s',
                  position: 'relative',
                  zIndex: 1,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #b0f7d3 70%, #8be8b8 100%)',
                    boxShadow: '0 0 18px 2px #7ce9c3',
                  }
                };
              }
              if (val === min && max !== min) {
                // Highlight min (red)
                return {
                  background: 'linear-gradient(90deg, #ffe6e7 70%, #ffd6d6 100%)',
                  color: '#b71c1c',
                  fontWeight: 900,
                  boxShadow: '0 0 10px 1px #ffbdbd',
                  transition: 'background 0.18s, box-shadow 0.18s',
                  position: 'relative',
                  zIndex: 1,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #ffcccc 70%, #ffbdbd 100%)',
                    boxShadow: '0 0 18px 2px #ffbdbd',
                  }
                };
              }
              return {
                background: 'inherit',
                color: val > 0 ? "#1976d2" : "#444",
                fontWeight: 500,
                transition: 'background 0.18s, box-shadow 0.18s',
                '&:hover': {
                  background: 'linear-gradient(90deg, #e3f0fd 70%, #f2faff 100%)',
                  color: '#1565c0',
                },
              };
            };
            return (
              <Box
                sx={{
                  flexGrow: 1,
                  width: "100%",
                  height: "100vh",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "#fafafa",
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom textAlign="center">
                  Inspections — 10 derniers jours
                </Typography>
                {dateLabels.length === 0 ? (
                  <Typography textAlign="center">Aucune inspection récente</Typography>
                ) : null}

                {/* Responsive data table */}
                <TableContainer
                  component={Paper}
                  elevation={3}
                  sx={{
                    mt: 3,
                    maxWidth: '100%',
                    borderRadius: 2,
                    bgcolor: "#fafbfc",
                    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ mb: 1, textAlign: 'center', fontWeight: 'bold', pt: 2 }}>
                    Détail des inspections par superviseur et par jour
                  </Typography>
                  <Table
                    size="medium"
                    sx={{
                      minWidth: 700,
                      borderCollapse: 'separate',
                      borderSpacing: '0 8px',
                      width: '100%',
                      tableLayout: 'fixed',
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          background: 'linear-gradient(90deg, #e0e0e0, #f5f5f5)',
                          boxShadow: 'inset 0 -2px 0 #bbb',
                          position: 'sticky',
                          top: 0,
                          zIndex: 3,
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            bgcolor: "#e0e0e0",
                            position: "sticky",
                            left: 0,
                            zIndex: 4,
                            textAlign: 'center',
                            borderRight: '1px solid #bbb',
                            width: 280,
                            minWidth: 200,
                            maxWidth: 320,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontSize: '1.1rem',
                            py: 2,
                            letterSpacing: 0.2,
                          }}
                        >
                          Superviseur
                        </TableCell>
                        {dateLabels.map((date) => (
                          <TableCell
                            key={date}
                            align="center"
                            sx={{
                              fontWeight: "bold",
                              bgcolor: "#e0e0e0",
                              textAlign: 'center',
                              borderRight: '1px solid #bbb',
                              whiteSpace: 'nowrap',
                              fontSize: '1.1rem',
                              py: 1.7,
                              letterSpacing: 0.1,
                            }}
                          >
                            {(() => {
                              const d = new Date(date);
                              return `${d.getDate()}/${d.getMonth() + 1}`;
                            })()}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(inspectionsByInspector).map((name, idx) => (
                        <TableRow
                          key={name}
                          hover
                          sx={{
                            background: idx % 2 === 0
                              ? 'linear-gradient(90deg, #ffffff 90%, #f4f8ff 100%)'
                              : 'linear-gradient(90deg, #f5f7fa 90%, #e9f0fa 100%)',
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'background 0.2s, box-shadow 0.2s',
                            '& td': {
                              borderBottom: '1px solid #e0e0e0',
                              borderRight: '1px solid #f0f0f0',
                              py: 1.6,
                              fontSize: '1.1rem',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                            },
                            '&:last-child td': {
                              borderBottom: 'none',
                            },
                            '&:last-child td:first-of-type': {
                              borderBottomLeftRadius: 8,
                            },
                            '&:last-child td:last-of-type': {
                              borderBottomRightRadius: 8,
                            },
                            '&:hover': {
                              background: 'linear-gradient(90deg, #dbe9ff 90%, #b1d0fa 100%)',
                              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.13)',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              position: "sticky",
                              left: 0,
                              bgcolor: "#fff",
                              zIndex: 2,
                              textAlign: 'center',
                              borderRight: '1px solid #ddd',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              fontSize: '1.1rem',
                              py: 1.7,
                              minWidth: 200,
                              maxWidth: 320,
                              width: 280,
                              letterSpacing: 0.1,
                              verticalAlign: 'middle',
                            }}
                          >
                            {name}
                          </TableCell>
                          {dateLabels.map((date) => {
                            const val = inspectionsByInspector[name][date] || 0;
                            return (
                              <TableCell
                                key={date}
                                align="center"
                                sx={highlightCellSx(val, date)}
                              >
                                {val}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
}