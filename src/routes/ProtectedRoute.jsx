import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { asyncStatus } from "../utils/asyncStatus";
import { FullPageLoader } from "../components/Loading.jsx"

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const {
    user_data,
    accessToken,
    user_auth,
    check_auth_status,
    user_role
  } = useSelector((state) => state.auth);
  console.log("Protected role check: ", user_role)
  const location = useLocation();

  if (check_auth_status === asyncStatus.LOADING) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <FullPageLoader />
      </div>
    );
  }

  if (!user_auth || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user_role)) {
    // If role not allowed, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;