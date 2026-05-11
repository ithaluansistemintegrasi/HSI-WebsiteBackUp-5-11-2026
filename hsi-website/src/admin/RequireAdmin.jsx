import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "./api";

export default function RequireAdmin() {
  const token = getToken();
  const loc = useLocation();

  if (!token) {
    return (
      <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />
    );
  }
  return <Outlet />;
}
