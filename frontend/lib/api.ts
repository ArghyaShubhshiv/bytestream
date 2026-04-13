import axios from "axios";

// This creates a custom Axios instance that already knows where your backend lives
export const api = axios.create({
  baseURL: "http://localhost:3001/api",
});