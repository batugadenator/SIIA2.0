import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("siia_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
