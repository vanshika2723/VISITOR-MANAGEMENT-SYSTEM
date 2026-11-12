
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach authentication token to API requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("visitor_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid login sessions
api.interceptors.response.use(
  (response) => response,
(error) => {
  console.error("API ERROR URL:", error.config?.url);
  console.error("API ERROR STATUS:", error.response?.status);
  console.error("API ERROR DATA:", error.response?.data);

  if (error.response?.status === 401) {
    sessionStorage.removeItem("visitor_token");
    sessionStorage.removeItem("visitor_user");

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return Promise.reject(error);
}
);

export default api;
