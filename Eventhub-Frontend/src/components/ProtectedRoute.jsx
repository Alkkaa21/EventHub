import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }) {
  // The access token may be expired; apiFetch refreshes it on demand.
  // The session is only dead when the refresh token is gone or expired.
  if (!isTokenValid(localStorage.getItem("refresh"))) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;