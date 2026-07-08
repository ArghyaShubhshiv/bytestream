import axios from "axios";

// Axios instance pointing at the backend API.
// In production set VITE_API_URL to the deployed backend's API root,
// e.g. https://api.yourdomain.com/api
// In local development it falls back to the local backend.
const baseURL =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL,
});

// Attach the JWT token to every request automatically if one is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bytestream_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server rejects our token (expired / invalid / signed with an old
// JWT_SECRET), clear the stale session and send the user back to log in.
// Auth endpoints are excluded so a failed login still shows its own error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/");
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("bytestream_token");
      localStorage.removeItem("bytestream_user");
      if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);
