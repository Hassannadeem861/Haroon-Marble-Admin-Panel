import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PublicRoute = ({ children }) => {
  const { accessToken, user_auth } = useSelector((state) => state.auth);
  // console.log("accessToken :", accessToken);
  // console.log("user_auth :", user_auth);

  if (user_auth && accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
