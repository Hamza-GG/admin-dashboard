import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import authAxios from "../utils/authAxios";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";

// ---- Vite icon fix ----
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl:      new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl:    new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await authAxios.get("/api/last-locations");
      console.log("Fetched locations:", res.data);
      setLocations(res.data);
      setFilteredLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch supervisor locations", err);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setFilteredLocations(
      selectedUser ? locations.filter(l => l.username === selectedUser) : locations
    );
  }, [selectedUser, locations]);

  const center = [33.5899, -7.6039]; // Casablanca
  const zoom = 12;

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
          options={[...new Set(locations.map(loc => loc.username))]}
          value={selectedUser}
          onChange={(_, v) => setSelectedUser(v)}
          renderInput={(params) => <TextField {...params} label="Inspected By" size="small" />}
          clearOnEscape
        />
      </Box>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#eaeaea", zIndex: 0 }}
        whenCreated={(map) => {
          console.log("Leaflet map created:", map);
        }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          crossOrigin={true}
          detectRetina
          attribution="&copy; OpenStreetMap contributors"
        />
        {filteredLocations.map((loc) => (
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