// src/pages/Supervisors.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";

// --- Vite icon fix (ensures marker icons load) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl:      new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl:    new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- fetch last locations (admin-only endpoint) ---
  const fetchLocations = async () => {
    try {
      const res = await authAxios.get("/api/last-locations");
      console.log("Fetched locations:", res.data);
      setLocations(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Failed to fetch supervisor locations", err);
    }
  };

  useEffect(() => {
    fetchLocations();
    const id = setInterval(fetchLocations, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setFiltered(selectedUser ? locations.filter(l => l.username === selectedUser) : locations);
  }, [selectedUser, locations]);

  const userOptions = useMemo(
    () => Array.from(new Set(locations.map(l => l.username))),
    [locations]
  );

  // --- Leaflet sizing fix ---
  const mapRef = useRef(null);
  const center = [33.5899, -7.6039]; // Casablanca

  // Force Leaflet to compute size after mount and on resize
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // next tick
    setTimeout(() => {
      map.invalidateSize();
      console.log("Map invalidated size");
    }, 0);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <Box sx={{ width: "100%", height: "calc(100vh - 64px)", position: "relative" }}>
      {/* Floating filter card */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
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
          options={userOptions}
          value={selectedUser}
          onChange={(_, v) => setSelectedUser(v)}
          renderInput={(params) => <TextField {...params} label="Inspected By" size="small" />}
          clearOnEscape
        />
      </Box>

      {/* Map container MUST have a hard height. Give it 100% of the parent which we set above. */}
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#eaeaea" }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
          console.log("Leaflet map created");
        }}
      >
        {/* Use single-host OSM tiles + crossOrigin to avoid CSP/extension issues.
           After this mounts you should see requests to https://tile.openstreetmap.org in Network. */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          crossOrigin={true}
          detectRetina
          attribution="&copy; OpenStreetMap contributors"
        />

        {filtered.map((loc) => (
          <Marker key={loc.user_id} position={[loc.latitude, loc.longitude]}>
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