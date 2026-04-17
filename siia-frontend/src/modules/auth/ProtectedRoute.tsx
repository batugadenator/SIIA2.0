import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredToken } from "../../services/auth";

type ProtectedRouteProps = {
  children?: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
