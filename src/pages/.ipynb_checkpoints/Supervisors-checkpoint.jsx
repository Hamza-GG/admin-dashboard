import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";

// MUI components
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Typography
} from "@mui/material";

// Custom marker icon
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await authAxios.get("/api/last-locations");
        setLocations(res.data || []);
      } catch (err) {
        console.error("Failed to fetch supervisor locations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Unique usernames for dropdown
  const userOptions = useMemo(
    () => Array.from(new Set(locations.map((l) => l.username))).sort(),
    [locations]
  );

  // Filtered markers
  const visibleLocations = useMemo(
    () =>
      selectedUser
        ? locations.filter((l) => l.username === selectedUser)
        : locations,
    [locations, selectedUser]
  );

  const center = [33.5899, -7.6039]; // Casablanca

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        📍 Dernières localisations des superviseurs
      </Typography>

      {/* MUI Dropdown Filter */}
      <FormControl size="small" sx={{ minWidth: 250, mb: 2 }}>
        <InputLabel>Superviseur</InputLabel>
        <Select
          value={selectedUser}
          label="I"
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <MenuItem value="">All supervisors</MenuItem>
          {userOptions.map((u) => (
            <MenuItem key={u} value={u}>
              {u}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Typography>Loading map...</Typography>
      ) : (
        <MapContainer
          center={center}
          zoom={12}
          style={{ minHeight: "80vh", width: "70vw" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {visibleLocations.map((loc) => (
            <Marker
              key={loc.user_id}
              position={[loc.latitude, loc.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <strong>{loc.username}</strong>
                <br />
                {new Date(loc.timestamp).toLocaleString()}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </Box>
  );
}