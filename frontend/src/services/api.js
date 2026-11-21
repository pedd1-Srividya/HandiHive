
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

// Automatically attach the login token to API requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("handihive_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Convert API errors into readable messages
export const errMsg = (e) => {
  const d = e?.response?.data?.detail;

  if (Array.isArray(d)) {
    return d
      .map((x) => `${x.loc?.slice(-1)[0]}: ${x.msg}`)
      .join("; ");
  }

  return (
    d ||
    (e?.code === "ERR_NETWORK"
      ? "Cannot reach the server. Is the backend running?"
      : "Something went wrong.")
  );
};

export default api;
