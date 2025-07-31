// authAxios.js
import axios from "axios";

const BASE_URL = "https://employee-inspection-backend.onrender.com";

// Create an Axios instance
const authAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Needed to send cookies like refresh token
});

// Intercept each request and attach the access token
authAxios.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to auto-refresh token if access token is expired
authAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${BASE_URL}/refresh`, {}, { withCredentials: true });
        const newToken = res.data.access_token;
        localStorage.setItem("token", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return authAxios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default authAxios;