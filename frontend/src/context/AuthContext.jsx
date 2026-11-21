
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginUser,
  registerCustomer as registerCustomerUser,
  registerCreator as registerCreatorUser,
  getMyProfile,
  logout as logoutUser,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check whether a user is already logged in
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("handihive_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMyProfile();
        setUser(profile);
      } catch (error) {
        logoutUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // Login
  const login = async (email, password) => {
    await loginUser(email, password);
    const profile = await getMyProfile();
    setUser(profile);
    return profile;
  };

  // Customer registration
  const registerCustomer = async (data) => {
    await registerCustomerUser(data);
    const profile = await getMyProfile();
    setUser(profile);
    return profile;
  };

  // Creator registration
  const registerCreator = async (data) => {
    await registerCreatorUser(data);
    const profile = await getMyProfile();
    setUser(profile);
    return profile;
  };

  // Logout
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    registerCustomer,
    registerCreator,
    logout,
    isAuthenticated: !!user,
    isCustomer: user?.role === "customer",
    isCreator: user?.role === "creator",
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Access authentication from any component
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
