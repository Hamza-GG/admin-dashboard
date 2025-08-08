import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";

// Optional: Custom marker icon if default is broken
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(""); // "" = All

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

  // Unique usernames for the dropdown
  const userOptions = useMemo(
    () => Array.from(new Set(locations.map((l) => l.username))).sort(),
    [locations]
  );

  // Filtered markers based on dropdown
  const visibleLocations = useMemo(
    () =>
      selectedUser
        ? locations.filter((l) => l.username === selectedUser)
        : locations,
    [locations, selectedUser]
  );

  const center = [33.5899, -7.6039]; // Casablanca

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Supervisors Last Known Locations</h2>

      {/* Dropdown filter */}
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="userFilter" style={{ marginRight: 8 }}>
          Filter by user:
        </label>
        <select
          id="userFilter"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{ padding: 6, minWidth: 220 }}
        >
          <option value="">All supervisors</option>
          {userOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading map...</p>
      ) : (
        <MapContainer center={center} zoom={12} style={{ height: "80vh", width: "100%" }}>
          <TileLayer
            // If tiles don't show up in prod, make sure your CSP allows this host.
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
    </div>
  );
}