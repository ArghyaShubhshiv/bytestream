import axios from "axios";

// Axios instance pointing at the backend API.
// In development, Vite proxies /api → http://localhost:3001 (see vite.config.ts),
// so both baseURL forms work. We use the absolute URL so it also works
// when the frontend is served independently.
export const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

// Attach the JWT token to every request automatically if one is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bytestream_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
