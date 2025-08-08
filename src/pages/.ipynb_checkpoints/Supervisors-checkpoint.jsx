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

// Default marker icon fix for Leaflet
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

  // Fetch data on load and every 60 seconds
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update filtered locations when a user is selected
  useEffect(() => {
    if (selectedUser) {
      setFilteredLocations(locations.filter(loc => loc.username === selectedUser));
    } else {
      setFilteredLocations(locations);
    }
  }, [selectedUser, locations]);

  const center = [33.5899, -7.6039]; // Casablanca

  // ✅ Map style
  const mapStyles = {
    width: "100%",
    height: "calc(100vh - 64px)", // minus navbar
    zIndex: 0,
  };

  return (
    <Box sx={{ height: "calc(100vh - 64px)", width: "100%", position: "relative" }}>
      {/* Dropdown Filter */}
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
            <TextField {...params} label="Superviseur" size="small" />
          )}
          clearOnEscape
        />
      </Box>

      {/* Map Container */}
      <MapContainer center={center} zoom={13} style={mapStyles}>
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