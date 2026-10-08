import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { asyncStatus } from "../utils/asyncStatus";
import { FullPageLoader } from "../components/Loading.jsx";

// Access token sirf memory mein hai (reload par khali) — apiHandle pehli request se pehle
// refresh cookie se naya le leta hai. Is liye yahan sirf user_auth dekho.
const ProtectedRoute = ({ children }) => {
  const { user_auth, check_auth_status } = useSelector((state) => state.auth);
  const location = useLocation();

  if (check_auth_status === asyncStatus.LOADING) {
    return <FullPageLoader />;
  }

  if (!user_auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
