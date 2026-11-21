
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Wait until login status is checked
  if (loading) {
    return (
      <div className="text-center py-10">
        Checking login...
      </div>
    );
  }

  // Send guests to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check whether the user's role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
