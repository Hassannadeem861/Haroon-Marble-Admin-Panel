import { Navigate } from "react-router-dom";  // react-router se import karo, react-router nahi
import { useSelector } from "react-redux";

const PublicRoute = ({ children }) => {
  const { 
    user_data,    
    accessToken,   
    user_auth     
  } = useSelector((state) => state.auth);  

 
  if (user_auth && accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;