
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

// Handle API responses and errors
api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("========== API ERROR ==========");
    console.error("URL:", error.config?.url);
    console.error("METHOD:", error.config?.method);
    console.error("MESSAGE:", error.message);
    console.error("CODE:", error.code);
    console.error("STATUS:", error.response?.status);

    console.error(
      "RESPONSE DATA:",
      JSON.stringify(error.response?.data, null, 2)
    );

    console.error("================================");

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
