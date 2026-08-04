import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export function RoleGuard({ allow }: { allow: Role[] }) {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
