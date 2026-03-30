import { useEffect, useState } from "react";
import authAxios from "../utils/authAxios";

function LocationTracker() {
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    const checkRoleAndTrack = async () => {
      try {
        // Get current user role from backend
        const res = await authAxios.get("/users/me"); 
        if (res.data.role === "supervisor") {
          setIsSupervisor(true);
        }
      } catch (err) {
        console.error("❌ Failed to get user info:", err);
      }
    };

    checkRoleAndTrack();
  }, []);

  useEffect(() => {
    if (!isSupervisor) return;

    const sendLocation = async () => {
      console.log("📡 Trying to get location...");

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log("📍 Got location:", latitude, longitude);

            try {
              const res = await authAxios.post(
                "https://employee-inspection-backend.onrender.com/api/locations",
                { latitude, longitude }
              );

              console.log("✅ Location sent, status:", res.status, res.data);
            } catch (error) {
              console.error("❌ Failed to send location:", error);
            }
          },
          (error) => {
            console.warn("⚠️ Geolocation error:", error);
          },
          { enableHighAccuracy: true }
        );
      } else {
        console.warn("❌ Geolocation not supported");
      }
    };

    sendLocation(); // Send immediately
    const intervalId = setInterval(sendLocation, 60_000); // Every 1 minute

    return () => clearInterval(intervalId);
  }, [isSupervisor]);

  return null;
}

export default LocationTracker;