import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
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

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await authAxios.get("/api/last-locations");
      setLocations(res.data);
      setFilteredLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch supervisor locations", err);
    }
  };

  // Fetch on load + every 60 seconds
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 60000);
    return () => clearInterval(interval);
  }, []);

  const center = [33.5899, -7.6039]; // Casablanca

  // Update filteredLocations based on selected user
  useEffect(() => {
    if (selectedUser) {
      setFilteredLocations(locations.filter(loc => loc.username === selectedUser));
    } else {
      setFilteredLocations(locations);
    }
  }, [selectedUser, locations]);

  return (
    <Box sx={{ height: "100vh", width: "100%", position: "relative" }}>
      <Box sx={{ position: "absolute", top: 20, left: 20, zIndex: 1000, background: "white", p: 2, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>📍 Dernières localisations des superviseurs</Typography>
        <Autocomplete
          options={[...new Set(locations.map(loc => loc.username))]}
          value={selectedUser}
          onChange={(e, newValue) => setSelectedUser(newValue)}
          renderInput={(params) => <TextField {...params} label="Inspected By" size="small" />}
          clearOnEscape
        />
      </Box>

      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {filteredLocations.map((loc) => (
          <Marker
            key={loc.user_id}
            position={[loc.latitude, loc.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{loc.username}</strong><br />
              {new Date(loc.timestamp).toLocaleString("fr-MA", {
                timeZone: "Africa/Casablanca",
                dateStyle: "short",
                timeStyle: "short"
              })}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}