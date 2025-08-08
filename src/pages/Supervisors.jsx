import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import authAxios from "../utils/authAxios";

// Custom Leaflet marker icon
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
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
    fetchLocations(); // initial load
    const intervalId = setInterval(fetchLocations, 60000); // refresh every 60s
    return () => clearInterval(intervalId); // cleanup
  }, []);

  const filteredLocations = locations.filter((loc) =>
    loc.username.toLowerCase().includes(search.toLowerCase())
  );

  const center = [33.5899, -7.6039]; // Casablanca center

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Top Bar with Search */}
      <div className="p-4 bg-white shadow-md z-[1000]">
        <h2 className="text-xl font-bold mb-2">📍 Dernières localisations des superviseurs</h2>
        <input
          type="text"
          placeholder="🔍 Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md p-2 border rounded shadow-sm"
        />
      </div>

      {/* Map Section */}
      <div className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading map...</div>
        ) : (
          <MapContainer
            center={center}
            zoom={12}
            className="h-full w-full z-0"
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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