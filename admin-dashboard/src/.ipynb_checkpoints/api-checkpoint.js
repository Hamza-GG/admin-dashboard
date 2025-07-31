const BASE_URL = "http://localhost:8000"; // change to your FastAPI URL

export async function login(username, password) {
  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      username,
      password
    })
  });
  if (!response.ok) {
    throw new Error("Login failed");
  }
  return response.json();
}

export async function getRiders(token) {
  const response = await fetch(`${BASE_URL}/riders`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Could not fetch riders");
  }
  return response.json();
}

// ...Add more functions as you add more endpoints!