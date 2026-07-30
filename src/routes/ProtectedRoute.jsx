import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { asyncStatus } from "../utils/asyncStatus";
import { FullPageLoader } from "../components/Loading.jsx";

const ProtectedRoute = ({ children }) => {
  const { accessToken, user_auth, check_auth_status } = useSelector(
    (state) => state.auth,
  );
  // console.log("accessToken :", accessToken);
  // console.log("user_auth :", user_auth);
  // console.log("check_auth_status :", check_auth_status);
  
  const location = useLocation();

  if (check_auth_status === asyncStatus.LOADING) {
    return <FullPageLoader />;
  }

  if (!user_auth || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
