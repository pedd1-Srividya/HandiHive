
import api from "./api";

// Save the login token
export const saveToken = (token) => {
  localStorage.setItem("handihive_token", token);
};

// Get saved token
export const getToken = () => {
  return localStorage.getItem("handihive_token");
};

// Remove token during logout
export const logout = () => {
  localStorage.removeItem("handihive_token");
};

// Customer registration
export const registerCustomer = async (data) => {
  const response = await api.post("/auth/register/customer", data);

  saveToken(response.data.access_token);

  return response.data;
};

// Creator registration
export const registerCreator = async (data) => {
  const response = await api.post("/auth/register/creator", data);

  saveToken(response.data.access_token);

  return response.data;
};

// Login
export const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  saveToken(response.data.access_token);

  return response.data;
};

// Get logged-in user's profile
export const getMyProfile = async () => {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};
