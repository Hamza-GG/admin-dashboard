const BASE_URL = "https://employee-inspection-backend.onrender.com";

export async function fetchWithAutoRefresh(endpoint, options = {}) {
  let token = localStorage.getItem("token");

  // First attempt with current access token
  let res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include", // needed if endpoint sets any cookies (defensive)
  });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("token", data.access_token);

      // Retry original request with new token
      res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${data.access_token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } else {
      // Refresh failed, logout
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }
  }

  return res;
}