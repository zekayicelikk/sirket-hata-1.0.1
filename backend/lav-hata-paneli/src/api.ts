import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:5000/api"
});

// Her istek öncesi token ekle
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expire veya yetkisiz durumda kullanıcıyı logout et ve login’e gönder
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && [401, 403].includes(error.response.status)) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      // Kullanıcıyı login ekranına gönder
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
