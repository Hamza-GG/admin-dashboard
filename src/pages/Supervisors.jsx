// src/pages/Supervisors.jsx
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

// Helper to fit bounds to markers when data/filters change
function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      // single point: set view with a nice zoom
      map.setView([points[0].latitude, points[0].longitude], 13, { animate: true });
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);

  return null;
}

export default function Supervisors() {
  const [locations, setLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await authAxios.get("/api/last-locations");
      setLocations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch supervisor locations", err);
    }
  };

  // initial + poll every 60s
 useEffect(() => {
  fetchLocations();
  const dataInterval = setInterval(fetchLocations, 60_000); // refresh data
  const pageInterval = setInterval(() => {
    window.location.reload(); // full page reload every 1 min
  }, 60_000);

  return () => {
    clearInterval(dataInterval);
    clearInterval(pageInterval);
  };
}, []);

  const usernames = useMemo(
    () => Array.from(new Set(locations.map(l => l.username))).sort(),
    [locations]
  );

  const filtered = useMemo(() => {
    return selectedUser ? locations.filter(l => l.username === selectedUser) : locations;
  }, [locations, selectedUser]);

  // Casablanca fallback center
  const fallbackCenter = [33.5899, -7.6039];

  return (
    <Box
      sx={{
        // full viewport width (ignores any layout padding)
        width: "100vw",
        // full height minus app bar (64 desktop / 56 mobile)
        height: { xs: "calc(100vh - 56px)", md: "calc(100vh - 64px)" },
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Floating filter card */}
    <Box
  sx={{
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    bgcolor: "white",
    p: 2,
    borderRadius: 2,
    boxShadow: 3,
    minWidth: 300,
  }}
>
  <Typography variant="subtitle1" sx={{ mb: 1 }}>
    📍 Dernières localisations des superviseurs
  </Typography>

  <Autocomplete
    size="small"
    options={usernames}
    value={selectedUser}
    onChange={(_, v) => setSelectedUser(v)}
    renderInput={(params) => <TextField {...params} label="Superviseur" />}
    clearOnEscape
  />
</Box>

      {/* The Map */}
      <MapContainer
        center={fallbackCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        // avoids tiny “white strip” glitches on some browsers when resizing
        preferCanvas
      >
        <TileLayer
          // OSM standard tiles
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Center/fit to the visible markers */}
        <FitBounds points={filtered} />

        {filtered.map((loc) => (
          <Marker
            key={`${loc.user_id}-${loc.timestamp}`}
            position={[loc.latitude, loc.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{loc.username}</strong>
              <br />
              {new Date(loc.timestamp).toLocaleString("fr-MA", {
                timeZone: "Africa/Casablanca",
                dateStyle: "short",
                timeStyle: "short",
              })}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}