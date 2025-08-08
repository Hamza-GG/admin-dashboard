import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await authAxios.get("/api/last-locations");
        setLocations(res.data);
      } catch (err) {
        console.error("Failed to fetch supervisor locations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const center = [33.5899, -7.6039]; // Default map center (Casablanca)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Supervisors Last Known Locations</h2>
      {loading ? (
        <p>Loading map...</p>
      ) : (
        <MapContainer center={center} zoom={12} style={{ height: "80vh", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
          />
          {locations.map((loc) => (
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
