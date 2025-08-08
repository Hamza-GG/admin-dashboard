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

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setFilteredLocations(locations.filter(loc => loc.username === selectedUser));
    } else {
      setFilteredLocations(locations);
    }
  }, [selectedUser, locations]);

  const center = [33.5899, -7.6039];

  return (
    <Box sx={{ width: "100%", height: "calc(100vh - 64px)", position: "relative" }}>
      {/* Filter Dropdown */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          backgroundColor: "white",
          padding: 2,
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
          onChange={(e, newValue) => setSelectedUser(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Inspected By" size="small" />
          )}
          clearOnEscape
        />
      </Box>

      {/* Map Container */}
      <Box sx={{ width: "100%", height: "100%" }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%", zIndex: 0 }}>
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
    </Box>
  );
}