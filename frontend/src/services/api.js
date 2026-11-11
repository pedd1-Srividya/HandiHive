import axios from "axios";

// Set VITE_API_URL in frontend/.env (see .env.example)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api" });

// Turn any API/network error into a readable message
export const errMsg = (e) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => `${x.loc?.slice(-1)[0]}: ${x.msg}`).join("; ");
  return d || (e?.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : "Something went wrong.");
};
export default api;
