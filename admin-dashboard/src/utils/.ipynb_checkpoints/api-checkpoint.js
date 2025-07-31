export async function fetchWithAutoRefresh(url, options = {}) {
  let accessToken = localStorage.getItem("access_token");

  // First attempt with current access token
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch("/refresh", {
      method: "POST",
      credentials: "include", // ⬅️ IMPORTANT to send HttpOnly cookie
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("access_token", data.access_token);

      // Retry original request
      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${data.access_token}`,
          "Content-Type": "application/json",
        },
      });
    } else {
      // Refresh failed, logout
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      return;
    }
  }

  return res;
}