import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";

// Fix default marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function SupervisorsMap() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const res = await authAxios.get("/api/last-locations");
      setLocations(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch supervisor locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(); // initial
    const intervalId = setInterval(fetchLocations, 60000); // refresh every 60s
    return () => clearInterval(intervalId);
  }, []);

  const filteredLocations = locations.filter((loc) =>
    loc.username.toLowerCase().includes(search.toLowerCase())
  );

  const center = [33.5899, -7.6039]; // Casablanca

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", backgroundColor: "#fff", zIndex: 1000 }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          📍 Dernières localisations des superviseurs
        </h2>
        <input
          type="text"
          placeholder="🔍 Search by username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px",
            width: "100%",
            maxWidth: "400px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <div style={{ flex: 1 }}>
        {loading ? (
          <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading map...</p>
        ) : (
          <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            />
            {filteredLocations.map((loc) => (
              <Marker
                key={loc.user_id}
                position={[loc.latitude, loc.longitude]}
              >
                <Popup>
                  <strong>{loc.username}</strong>
                  <br />
                  {new Date(loc.timestamp).toLocaleString("fr-MA")}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}