import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FitToMarkers({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (points.length === 0) {
      // Default center (Casa)
      map.setView([33.5899, -7.6039], 12, { animate: false });
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await authAxios.get("/api/last-locations");
      setLocations(res.data);
      setFilteredLocations(
        selectedUser ? res.data.filter((l) => l.username === selectedUser) : res.data
      );
    } catch (err) {
      console.error("Failed to fetch supervisor locations", err);
    }
  };

  useEffect(() => {
    fetchLocations();
    const t = setInterval(fetchLocations, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const userOptions = useMemo(
    () => Array.from(new Set(locations.map((l) => l.username))).sort(),
    [locations]
  );

  const points = useMemo(
    () => filteredLocations.map((l) => [l.latitude, l.longitude]),
    [filteredLocations]
  );

  return (
    <Box
      sx={{
        // Fill the viewport height minus your AppBar (64px default on desktop)
        height: { xs: "calc(100vh - 56px)", md: "calc(100vh - 64px)" },
        width: "100%",           // <-- no 100vw, avoids off-center scrollbars
        position: "relative",
      }}
    >
      {/* Filter panel */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          backgroundColor: "white",
          p: 2,
          borderRadius: 2,
          boxShadow: 3,
          minWidth: 280,
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          📍 Dernières localisations des superviseurs
        </Typography>
        <Autocomplete
          options={userOptions}
          value={selectedUser}
          onChange={(_e, val) => setSelectedUser(val)}
          renderInput={(params) => (
            <TextField {...params} label="Superviseur" size="small" />
          )}
          clearOnEscape
        />
      </Box>

      {/* Map */}
      <MapContainer
        // Any initial center/zoom — FitToMarkers will adjust it
        center={[33.5899, -7.6039]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}  // <-- fills the Box without overflow
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <FitToMarkers points={points} />

        {filteredLocations.map((loc) => (
          <Marker
            key={loc.user_id}
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