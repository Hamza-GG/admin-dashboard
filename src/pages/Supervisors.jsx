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

// Fix Leaflet's default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
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
      console.log("Fetched locations:", res.data);
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
      setFilteredLocations(locations.filter((loc) => loc.username === selectedUser));
    } else {
      setFilteredLocations(locations);
    }
  }, [selectedUser, locations]);

  const mapCenter = [33.5899, -7.6039]; // Casablanca

  return (
    <Box sx={{ width: "100%", height: "calc(100vh - 64px)", position: "relative" }}>
      {/* Dropdown filter */}
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
          options={[...new Set(locations.map((loc) => loc.username))]}
          value={selectedUser}
          onChange={(e, newValue) => setSelectedUser(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Inspected By" size="small" />
          )}
          clearOnEscape
        />
      </Box>

      {/* Map */}
      <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {filteredLocations.map((loc) => (
          <Marker
            key={loc.user_id}
            position={[loc.latitude, loc.longitude]}
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