// src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired veya yetkisiz
      localStorage.removeItem("token");
      window.location.href = "/login"; // Kullanıcıyı login sayfasına gönder
    }
    return Promise.reject(error);
  }
);

export default api;
