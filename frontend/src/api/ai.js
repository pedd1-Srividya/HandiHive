
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const generateProductDescription = async (productData) => {
  const response = await API.post("/api/ai/describe", productData);
  return response.data;
};

export const generateCaption = async (productData) => {
  const response = await API.post("/api/ai/caption", productData);
  return response.data;
};
