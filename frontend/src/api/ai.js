
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

export const generateProductDescription = async (productData) => {
  const response = await API.post("/ai/describe", productData);
  return response.data;
};

export const generateCaption = async (productData) => {
  const response = await API.post("/ai/caption", productData);
  return response.data;
};
